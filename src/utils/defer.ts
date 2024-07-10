/**
 * https://github.com/tc39/proposal-promise-with-resolvers
 * Implementation of Promise.withResolvers
 */
const noop = () => {}

interface Deferred<T = void> {
  promise: Promise<T>;
  isResolved: boolean;
  isRejected: boolean;
  isFinished: boolean;
  value?: T;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  cancel: (reason?: unknown) => void;
}

function createDefer<T = void>(): Deferred<T> {
  const defer: Deferred<T> = {
    promise: undefined!,
    isResolved: false,
    isRejected: false,
    isFinished: false,
    resolve: undefined!,
    reject: undefined!,
    cancel: noop,
  }
  
  defer.promise = new Promise<T>((_resolve, _reject) => {
    defer.resolve = (value) => {
      if (!defer.isFinished) {
        defer.isResolved = true;
        defer.isFinished = true;
        _resolve(value);
        defer.value = value;
      }
    }
    defer.reject = (reason) => {
      if (!defer.isFinished) {
        defer.isRejected = true;
        defer.isFinished = true;
        _reject(reason);
      }
    }
  });

  return defer
}

function createResolvedDefer<T = void>(value: T): Deferred<T> {
  const defer = createDefer<T>()
  defer.resolve(value)
  return defer
}

function createTimeoutDefer(duration?: number) {
  const defer = createDefer()
  
  const timeout = setTimeout(defer.resolve, duration)
  defer.cancel = () => clearTimeout(timeout)

  return defer
}

export {
  type Deferred,
  createDefer,
  createTimeoutDefer,
  createResolvedDefer,
}