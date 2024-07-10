declare const globalThis: {
  Module: any;
};

declare module "*?worker" {
  const func: new (options?: WorkerOptions) => Worker;
  export default func;
}

declare module "*?worker&inline" {
  const func: new (options?: WorkerOptions) => Worker;
  export default func;
}

declare module "*?url" {
  const func: new () => string;
  export default func();
}

declare const AudioData: {
  prototype: AudioData;
  new (options: any): AudioData;
};

enum AudioSampleFormat {
  "u8",
  "s16",
  "s32",
  "f32",
  "u8-planar",
  "s16-planar",
  "s32-planar",
  "f32-planar",
}

/**
 *  https://w3c.github.io/webcodecs/#audiodata-interface
 *  Limited availability
 *  This feature is not Baseline because it does not work in some of the most widely-used browsers.
 */
interface AudioData {
  readonly format: AudioSampleFormat;
  readonly sampleRate: number;
  readonly numberOfFrames: number;
  readonly numberOfChannels: number;
  readonly duration: number;
  readonly timestamp: number;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioData/allocationSize) */
  allocationSize(options?: any): number;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioData/clone) */
  clone(): AudioData;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioData/close) */
  close(): void;
}

/**
 * This Web Workers API interface represents a background task that can be easily created and can send messages back to its creator. Creating a worker is as simple as calling the Worker() constructor and specifying a script to be run in the worker thread.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Worker)
 */
interface Worker extends EventTarget, AbstractWorker {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Worker/message_event) */
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Worker/messageerror_event) */
  onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null;
  /**
   * Clones message and transmits it to worker's global environment. transfer can be passed as a list of objects that are to be transferred rather than cloned.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Worker/postMessage)
   */
  postMessage(message: any, transfer: (Transferable | AudioData)[]): void;
  postMessage(message: any, options?: StructuredSerializeOptions): void;
  /**
   * Aborts worker's associated global environment.
   *
   * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Worker/terminate)
   */
  terminate(): void;
  addEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof WorkerEventMap>(
    type: K,
    listener: (this: Worker, ev: WorkerEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}
