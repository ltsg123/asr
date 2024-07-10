import { LogLevel, MessageType, ModelSource } from "../types";
import { init } from "../module/sherpa-ncnn-wasm-main";
import { speech2TextResult } from "../module";
import { createRecognizer } from "../module/sherpa-ncnn";

declare const self: {
  Module: any;
} & Worker;

self.Module = {};

class ASRProcessor {
  protected _source?: ModelSource;
  protected _module?: {
    recognizer: any;
    recognizer_stream: any;
  };

  public constructor() {
    self.onmessage = this._onmessage.bind(this);
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
    self.Module = {
      getPreloadedPackage: (name: string, size: number) => {
        if (type === "sherpa-ncnn") {
          return data;
        }
      },
      wasmBinary: wasm,
      onRuntimeInitialized: () => {
        // @ts-ignore
        const recognizer = createRecognizer(globalThis["Module"]);
        _log(LogLevel.INFO, "recognizer is created!");
        // @ts-ignore
        const recognizer_stream = recognizer.createStream();
        _log(LogLevel.INFO, "recognizer_stream is created!");
        this._module = {
          recognizer,
          recognizer_stream,
        };
      },
    };
    init(self.Module);
  }

  /**
   * dump the audio data after plug-in processing
   */
  protected _dump(): void {}

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
      } else if (type === MessageType.RECOGNITION) {
        const res = speech2TextResult(data, this._module);

        _postMessage({
          id,
          type: MessageType.RESULT,
          data: res,
        });

        return;
      }
      _postMessage({ id, type: MessageType.RESULT, data: {} });
    } catch (error) {
      _postMessage({
        id,
        type: MessageType.ERROR,
        data: error as Error,
      });
    }
  }
}

new ASRProcessor();

function _postMessage(
  message: {
    id?: number;
    type: MessageType;
    data: any;
  },
  transfers: Transferable[] = []
) {
  self.postMessage(message, transfers);
}

/**
 *
 * @param level
 * @param message
 *
 * send log message to main thread
 */
function _log(level: LogLevel, message: string) {
  _postMessage({
    type: MessageType.LOG,
    data: { level, message },
  });
}
