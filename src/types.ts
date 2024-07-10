export type ModelType = "sherpa-ncnn";

export interface ModelSource {
  type: ModelType;
  wasm: ArrayBuffer;
  data: ArrayBuffer;
}

enum WorkerMessageType {
  PROCESS,
}
export const enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export type BaseWorkletProcessorConfig = {
  //
  bufferSize: number;
};

type Message = {
  type: MessageType | WorkerMessageType;
  id: string;
  data: any;
};

const enum MessageType {
  INITIALIZE,
  RESET,
  DESTROY,
  //
  LOG,
  DUMP,
  DUMPEND,
  OVERLOAD,
  RESULT,
  BUFFER,

  ERROR,
  RECORD,
  RECOGNITION,
}
type ResponseMessage = { id: number };

export type { Message, ResponseMessage };
export { MessageType };
