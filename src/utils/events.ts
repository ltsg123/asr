interface EventListener {
  listener: Function;
  once: boolean;
}

/**
 * `EventEmitter` 类提供了定义、触发和处理事件的方式。
 */
/** @en
 * The `EventEmitter` class provides a way to define, emit, and handle events.
 */
export class EventEmitter {
  private _events: { [key: string]: EventListener[] } = {};

  /**
   * 指定一个事件名，获取当前所有监听这个事件的回调函数。
   *
   * @param event - 事件名称。
   */
  /** @en
   * Gets all the listeners for a specified event.
   *
   * @param event The event name.
   */
  public getListeners(event: string): Function[] {
    return this._events[event] ? this._events[event].map((e) => e.listener) : [];
  }

  /**
   * 监听一个指定的事件，当事件触发时会调用传入的回调函数。
   *
   * @param event - 指定事件的名称。
   * @param listener - 传入的回调函数。
   */
  /** @en
   * Listens for a specified event.
   *
   * When the specified event happens, the SDK triggers the callback that you pass.
   * @param event The event name.
   * @param listener The callback to trigger.
   */
  public on(event: string, listener: Function): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    const listeners = this._events[event];
    if (this._indexOfListener(listeners, listener) === -1) {
      listeners.push({
        listener,
        once: false,
      });
    }
  }

  /** @internal */
  public addListener: (event: string, listener: Function) => void = this.on;

  /**
   * 监听一个指定的事件，当事件触发时会调用传入的回调函数。
   *
   * 当监听后事件第一次触发时，该监听和回调函数就会被立刻移除，也就是只监听一次指定事件。
   *
   * @param event - 指定事件的名称。
   * @param listener - 传入的回调函数。
   */
  /** @en
   * Listens for a specified event once.
   *
   * When the specified event happens, the SDK triggers the callback that you pass and then removes the listener.
   * @param event The event name.
   * @param listener The callback to trigger.
   */
  public once(event: string, listener: Function): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    const listeners = this._events[event];
    if (this._indexOfListener(listeners, listener) === -1) {
      listeners.push({
        listener,
        once: true,
      });
    }
  }

  /**
   * 取消一个指定事件的监听。
   *
   * @param event - 指定事件的名称。
   * @param listener - 监听事件时传入的回调函数。
   */
  /** @en
   * Removes the listener for a specified event.
   *
   * @param event The event name.
   * @param listener The callback that corresponds to the event listener.
   */
  public off(event: string, listener: Function): void {
    if (!this._events[event]) {
      return;
    }
    const listeners = this._events[event];
    const index = this._indexOfListener(listeners, listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (this._events[event].length === 0) {
      delete this._events[event];
    }
  }

  /**
   * 指定一个事件，取消其所有的监听。
   *
   * @param event - 指定事件的名称，如果没有指定事件，则取消所有事件的所有监听。
   */
  /** @en
   * Removes all listeners for a specified event.
   *
   * @param event The event name. If left empty, all listeners for all events are removed.
   */
  public removeAllListeners(event?: string): void {
    if (!event) {
      this._events = {};
      return;
    }

    delete this._events[event];
  }

  /** @internal */
  public emit(event: string, ...args: any[]): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    const listeners = this._events[event].map((l) => l);
    for (let i = 0; i < listeners.length; i += 1) {
      const listener = listeners[i];
      if (listener.once) {
        this.off(event, listener.listener);
      }

      listener.listener.apply(this, args || []);
    }
  }

  /** @internal */
  public safeEmit(event: string, ...args: any[]): void {
    const fns = [...(this._events[event] || [])];

    fns.forEach((fn) => {
      if (fn.once) {
        this.off(event, fn.listener);
      }

      try {
        fn.listener.apply(this, args);
      } catch (error) {
        console.error(`safeEmit event:${event} error ${error?.toString()}`);
      }
    });
  }

  private _indexOfListener(listeners: EventListener[], listener: Function): number {
    let i = listeners.length;
    while (i--) {
      if (listeners[i].listener === listener) {
        return i;
      }
    }

    return -1;
  }
}
