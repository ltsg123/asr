import { MessageType as BaseMessageType, Message } from "../types";

enum WorkerMessageType {
  PROCESS,
}

type MessageType = WorkerMessageType | BaseMessageType;

export type { Message, MessageType };
export { WorkerMessageType, BaseMessageType };
