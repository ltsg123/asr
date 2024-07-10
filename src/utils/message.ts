import { Message, MessageType } from "../types";
import ASRWorker from "../worker?worker&inline";
import { getRandomString } from "./helper";
import logger from "./logger";
let worker: Worker | null;
let workletNode: AudioWorkletNode | null;
const workerMsgMap = new Map<string, (data: any) => void>();
const workerListenerMap = new Map<MessageType, (data: any) => void>();

export async function postWorkerMessage<T extends any>(
  type: MessageType,
  data: any,
  transfer?: (Transferable | AudioData)[]
): Promise<T> {
  if (!worker) {
    return data;
  }
  const id = getRandomString(6);

  return new Promise((resolve) => {
    workerMsgMap.set(id, resolve);
    worker?.postMessage({ type, id, data }, transfer || []);
  });
}

export async function postAudioWorkletMessage<T extends any>(
  type: MessageType,
  data: any,
  transfer?: Transferable[]
): Promise<T> {
  if (!workletNode) {
    return data;
  }
  const id = getRandomString(6);

  return new Promise((resolve) => {
    workerMsgMap.set(id, resolve);
    workletNode?.port.postMessage({ type, data, id }, transfer || []);
  });
}

async function initWorker(): Promise<Worker>;
async function initWorker(context: AudioContext): Promise<AudioWorkletNode>;
async function initWorker(
  context?: AudioContext
): Promise<Worker | AudioWorkletNode> {
  let workerOrWorklet: Worker | AudioWorkletNode;
  let workerOrMessagePort: Worker | MessagePort;
  if (!context) {
    workerOrWorklet = worker || new ASRWorker();
    workerOrMessagePort = workerOrWorklet;
    worker = workerOrWorklet as Worker;
  } else {
    /**
     * wasm use copy instead of transfer
     */
    await context.audioWorklet.addModule("../src/worklet/index.ts");
    workerOrWorklet = workletNode = new AudioWorkletNode(
      context,
      "asr-processor"
    );
    workerOrMessagePort = workerOrWorklet.port;
  }

  workerOrMessagePort.onmessage = (event: MessageEvent<Message>) => {
    const { data } = event;
    const { type, id, data: msg } = data;
    const listener = workerListenerMap.get(type as MessageType);
    switch (type) {
      case MessageType.INITIALIZE:
        break;
      case MessageType.BUFFER:
        listener && listener(msg);
        break;
      case MessageType.LOG:
        const { level, message } = msg;
        logger.log(level, message);
        break;
    }
    const resolve = workerMsgMap.get(id);
    workerMsgMap.delete(id);
    resolve && resolve(data.data || void 0);
  };

  return workerOrWorklet;
}

function addWorkerEventListener(
  type: MessageType,
  listener: (data: any) => any
) {
  workerListenerMap.set(type, listener);
}

function resetWorker() {
  workerMsgMap.clear();
  workerListenerMap.clear();
}

function clearWorker() {
  workerMsgMap.clear();
  workerListenerMap.clear();
  if (worker) {
    worker.onmessage = null;
    worker.terminate();
    worker = null;
  }
  if (workletNode) {
    workletNode.port.onmessage = null;
    workletNode.port.close();
    workletNode = null;
  }
}

export {
  initWorker,
  addWorkerEventListener,
  workerListenerMap,
  clearWorker,
  resetWorker,
};
