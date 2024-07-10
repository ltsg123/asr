import {
  BaseWorkletProcessorConfig,
  LogLevel,
  MessageType,
  ModelSource,
  ModelType,
} from "../types";
import { speech2TextResult } from "./module";
import { createRecognizer } from "./sherpa-ncnn";
import { BUFFER_SIZE } from "../constants";
import { concatFloat32Arrays, flatArray, flatten } from "../utils/helper";

declare const globalThis: {
  Module: any;
};
const Module = {};
Reflect.set(globalThis, "Module", Module);

export class ASRProcessor extends AudioWorkletProcessor {
  protected _source?: ModelSource;
  protected _destroyed: boolean;
  protected _module?: {
    recognizer: any;
    recognizer_stream: any;
  };
  private _LBuffers: Float32Array[];
  private _RBuffers: Float32Array[];
  private _Buffers: Float32Array[];

  public constructor(
    config: BaseWorkletProcessorConfig = { bufferSize: BUFFER_SIZE }
  ) {
    super();
    this.port.onmessage = this._onmessage.bind(this);
    this._destroyed = false;

    this._LBuffers = [];
    this._RBuffers = [];
    this._Buffers = [];
  }

  /**
   *
   * @param source
   *
   * init the wasm when start this worklet
   */
  protected _initialize(source: ModelSource) {
    if (this._source && this._source.type === source.type) {
      return Promise.resolve();
    }
    this._source = source;
    const { type, wasm, data } = source;
    globalThis["Module"] = {
      getPreloadedPackage: (name: string, size: number) => {
        if (type === "sherpa-ncnn") {
          return data;
        }
      },
      wasmBinary: wasm,
      onRuntimeInitialized: () => {
        // @ts-ignore
        const recognizer = createRecognizer(globalThis["Module"]);
        this._log(LogLevel.INFO, "recognizer is created!");
        // @ts-ignore
        const recognizer_stream = recognizer.createStream();
        this._log(LogLevel.INFO, "recognizer_stream is created!");
        this._module = {
          recognizer,
          recognizer_stream,
        };
      },
    };
  }

  // don't do any asynchronous operations in this real-time thread
  public process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    console.error("process");
    const inputList = inputs[0];
    if (inputList && inputList[0] && inputList[1]) {
      const samples = new Float32Array(inputList[0]);
      this._LBuffers.push(samples);
    }

    return true;
  }

  /**
   * dump the audio data after plug-in processing
   */
  protected _dump(): void {}

  /**
   *
   * @param level
   * @param message
   *
   * send log message to main thread
   */
  protected _log(level: LogLevel, message: string) {
    this._postMessage({
      type: MessageType.LOG,
      data: { level, message },
    });
  }

  private _reset() {
    //
  }

  private _destroy() {
    this._destroyed = true;
  }

  protected _postMessage(
    message: {
      id?: number;
      type: MessageType;
      data: any;
    },
    transfers: Transferable[] = []
  ) {
    this.port.postMessage(message, transfers);
  }

  // request and response
  private _onmessage(event: MessageEvent) {
    const rawData = event.data;
    if (!("id" in rawData)) {
      return;
    }
    const { id, type, data } = rawData;
    try {
      if (type === MessageType.INITIALIZE) {
        this._initialize(data);
      } else if (type === MessageType.RECORD) {
        let text = "";
        if (this._LBuffers.length > 10) {
          const buffer = flatArray(this._LBuffers);
          this._LBuffers.length = 0;
          const res = speech2TextResult(buffer, this._module);
          if (res) text += res.text;
        }

        this._postMessage({
          id,
          type: MessageType.RESULT,
          data: text,
        });
      }
      this._postMessage({ id, type: MessageType.RESULT, data: {} });
    } catch (error) {
      this._postMessage({
        id,
        type: MessageType.ERROR,
        data: error as Error,
      });
    }
  }
}

registerProcessor("asr-processor", ASRProcessor);
