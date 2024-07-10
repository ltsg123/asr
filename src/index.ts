import {
  BUFFER_SIZE,
  NUMBER_OF_INPUTS,
  NUMBER_OF_OUTPUTS,
  SAMPLE_RATE,
} from "./constants";
import { speech2TextResult } from "./module";
import { MessageType, ModelSource, ModelType } from "./types";
import { EventEmitter } from "./utils/events";
import { fetchWasmSource } from "./utils/fetch";
import { isSupportASR } from "./utils/helper";
import logger from "./utils/logger";
import {
  addWorkerEventListener,
  clearWorker,
  initWorker,
  postWorkerMessage,
} from "./utils/message";
import { getAudioContext } from "./utils/webaudio";

enum ChannelType {
  SCRIPT_PROCESSOR = "script_processor",
  AUDIO_WORKLET = "audio_worklet",
  INSERTABLE_STREAM = "insertable_stream",
}

interface ASRConfig {
  model: ModelType;
  sampleRate: number;
  // bufferSize: the onaudioprocess event is called when the buffer is full
  bufferSize: number;
  numberOfInputChannels: number;
  numberOfOutputChannels: number;
  channel: ChannelType;
}

class ASR extends EventEmitter {
  public static isSupport = isSupportASR;
  public static name: string = "ASR";
  private _mediaStreamTrack?: MediaStreamTrack;
  private _mediaStream?: MediaStream;
  private _mediaSource?: MediaStreamAudioSourceNode;
  private _audioCtx: AudioContext;
  private _config: ASRConfig = {
    model: "sherpa-ncnn",
    sampleRate: SAMPLE_RATE,
    bufferSize: BUFFER_SIZE,
    numberOfInputChannels: NUMBER_OF_INPUTS,
    numberOfOutputChannels: NUMBER_OF_OUTPUTS,
    channel: ChannelType.SCRIPT_PROCESSOR,
  };
  private _worker?: Worker;
  private _workletNode: AudioWorkletNode | null = null;
  private _audioBufferNode?: ScriptProcessorNode;
  private _modelSourcePromise?: Promise<ModelSource>;
  private _isDestroyed: boolean = false;

  public constructor(
    track?: MediaStreamTrack,
    config?: {
      model?: ModelType;
    }
  ) {
    super();
    if (!isSupportASR()) {
      throw new Error("The current environment does not support asr.");
    }
    if (config) {
      this._config = {
        ...this._config,
        ...config,
      };
    }
    const audioCtx = getAudioContext({ sampleRate: this._config.sampleRate });
    this._audioCtx = audioCtx;

    if (track) {
      this._mediaStreamTrack = track;
      this._mediaStream = new MediaStream([track]);
      // creates an audio node from the microphone incoming stream
      this._mediaSource = audioCtx.createMediaStreamSource(this._mediaStream);
    }
    this._init(this._config.channel);

    logger.info(
      `init ASR success, model: ${this._config.model}, channelType: ${this._config.channel}`
    );
  }

  public updateTrack(track: MediaStreamTrack) {
    if (this._mediaStreamTrack !== track) {
      this._mediaStreamTrack = track;
      this._mediaStream = new MediaStream([track]);
      this._mediaSource = this._audioCtx.createMediaStreamSource(
        this._mediaStream
      );
    }
  }

  public start() {
    if (this._isDestroyed) {
      throw new Error("cannot use asr because it's been destroyed.");
    }
    if (!this._mediaStreamTrack || !this._mediaStream) {
      throw new Error("cannot use asr because of no mediaStreamTrack.");
    }
    this._applyASR();
  }

  public stop() {
    if (this._audioBufferNode) {
      this._audioBufferNode.onaudioprocess = null;
      this._mediaSource?.disconnect(this._audioBufferNode);
      this._audioBufferNode.disconnect(this._audioCtx.destination);
      this._audioBufferNode = undefined;
    }

    if (this._workletNode) {
      this._mediaSource?.disconnect(this._workletNode);
      this._workletNode.disconnect(this._audioCtx.destination);
      this._workletNode = null;
    }

    if (this._worker) {
      this._worker.terminate();
      this._worker = undefined;
    }
  }

  public destroy() {
    this._isDestroyed = true;
    this.stop();
    this._audioCtx.close();
    this._modelSourcePromise = undefined;
    this._isDestroyed = true;
    clearWorker();
    this._mediaStream = undefined;
    this._mediaStreamTrack = undefined;
  }

  private async _init(channel: ChannelType.SCRIPT_PROCESSOR): Promise<void>;
  private async _init(channel: ChannelType): Promise<ModelSource>;
  private async _init(channel: ChannelType): Promise<ModelSource | void> {
    if (this._modelSourcePromise) {
      return await this._modelSourcePromise;
    } else {
      this._modelSourcePromise = fetchWasmSource(this._config.model);
      return await this._modelSourcePromise;
    }
  }

  private async _applyASR() {
    if (!this._mediaSource) {
      throw new Error("no found mediaSource when apply asr");
    }
    const channel = this._config.channel;
    if (channel === ChannelType.SCRIPT_PROCESSOR) {
      if (this._audioBufferNode) return;
      const { bufferSize, numberOfInputChannels, numberOfOutputChannels } =
        this._config;
      if ("createScriptProcessor" in AudioContext.prototype) {
        this._audioBufferNode = this._audioCtx.createScriptProcessor(
          bufferSize,
          numberOfInputChannels,
          numberOfOutputChannels
        );
      } else if ("createJavaScriptNode" in AudioContext.prototype) {
        // @ts-ignore
        this._audioBufferNode = this._audioCtx.createJavaScriptNode(
          bufferSize,
          numberOfInputChannels,
          numberOfOutputChannels
        ) as ScriptProcessorNode;
      } else {
        throw new Error("no support createScriptProcessor in web");
      }
      // init worker
      const worker = this._worker || (await initWorker());
      this._worker = worker;
      const modelSource =
        (await this._modelSourcePromise) || (await this._init(channel));
      this._bindWorkletEvent();
      logger.debug("ASR worker initialized");
      await postWorkerMessage(MessageType.INITIALIZE, {
        ...modelSource,
      });

      this._mediaSource.connect(this._audioBufferNode);
      this._audioBufferNode.connect(this._audioCtx.destination);
      let startFlag = false;

      this._audioBufferNode.onaudioprocess = async (e) => {
        const samples = new Float32Array(e.inputBuffer.getChannelData(0));
        const res = (await postWorkerMessage(MessageType.RECOGNITION, samples, [
          samples.buffer,
        ])) as
          | {
              sentence: string;
              text: string;
              isEndpoint: boolean;
            }
          | undefined;

        if (!res) return;
        const { sentence, isEndpoint, text } = res;
        if (text.length !== 0) {
          startFlag = true;
          this.emit("message", text, isEndpoint);
        } else if (startFlag && isEndpoint) {
          startFlag = false;
          this.emit("message", text, isEndpoint);
        }
        if (isEndpoint && sentence.length !== 0) {
          this.emit("sentence", sentence);
        }
      };

      return;
    } else if (channel === ChannelType.INSERTABLE_STREAM) {
      throw new Error("can not support INSERTABLE_STREAM");
    } else {
      throw new Error("can not support AudioWorklet");
      // const modelSource = this._modelSourcePromise || (await this._init(channel));
      // this._workletNode = await initWorker(this._audioCtx);
      // this._mediaSource.connect(this._workletNode);
      // this._workletNode.connect(this._audioCtx.destination);
      // this._bindWorkletEvent();
      // logger.debug("ASR worklet node initialized");
      // await postAudioWorkletMessage(MessageType.INITIALIZE, {
      //   ...modelSource,
      // });

      // setInterval(async () => {
      //   const time = Date.now();
      //   const res = await postAudioWorkletMessage(MessageType.RECORD, null);
      //   console.log("res cost", Date.now() - time);
      // }, 300);
    }

    return this._workletNode;
  }

  private _bindWorkletEvent() {
    addWorkerEventListener(MessageType.BUFFER, async (samples: ArrayBuffer) => {
      const buffer = new Float32Array(samples);
      const res = speech2TextResult(buffer);
      if (!res) return;
      const { sentence, isEndpoint, text } = res;
      if (text.length !== 0) {
        this.emit("message", text, isEndpoint);
      }
      if (isEndpoint && sentence.length !== 0) {
        this.emit("sentence", sentence);
      }
    });
  }
}

export default ASR;
