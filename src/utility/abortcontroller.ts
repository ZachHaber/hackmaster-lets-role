/**
 * @see {@link https://www.npmjs.com/package/abortcontroller-polyfill}
 */

export class Event {
  bubbles = false;
  cancelable = false;
  defaultPrevented = false;
  constructor(
    public type: string,
    options: { bubbles?: boolean; cancelable?: boolean } = {}
  ) {
    if (Array.isArray(type)) {
      // Combat the dumbness of lets role...
      this.type = type[0];
      options ||= type[1];
    }
    if (options.bubbles) {
      this.bubbles = true;
    }
    if (options.cancelable) {
      this.cancelable = true;
    }
  }
}
interface EmitterOptions {
  once?: boolean;
}
type Callback<E extends Event> = (event: E) => void;
/**
 * @see {@link https://www.npmjs.com/package/abortcontroller-polyfill}
 */
export class Emitter<E extends Event = Event> {
  //    // DEFAULT ARGUMENTS ARE GOOFED IN CLASSES!
  //    // or at least in "new" parts...
  //    let hook = arguments[0].length > 0 && arguments[0][0] !== undefined ? arguments[0][0] : function () {};
  public hook: ((type: string) => void) | undefined = undefined;
  constructor() {}
  listeners: Record<
    string,
    { callback: Callback<E>; options: EmitterOptions }[]
  > = {};
  addEventListener(
    type: string,
    callback: Callback<E>,
    options: EmitterOptions = {}
  ) {
    if (!(type in this.listeners)) {
      this.hook?.(type);
      this.listeners[type] = [];
    }
    this.listeners[type].push({ callback, options });
  }
  removeEventListener(type: string, callback: Callback<E>) {
    if (!(type in this.listeners)) {
      return;
    }
    const stack = this.listeners[type];
    for (let i = 0, l = stack.length; i < l; i++) {
      if (stack[i].callback === callback) {
        stack.splice(i, 1);
        return;
      }
    }
  }
  dispatchEvent(event: E) {
    if (!(event.type in this.listeners)) {
      return;
    }
    const stack = this.listeners[event.type];
    const stackToCall = stack.slice();
    for (let i = 0, l = stackToCall.length; i < l; i++) {
      const listener = stackToCall[i];
      try {
        listener.callback(event);
      } catch (e) {
        log(e);
        throw e;
      }
      if (listener.options && listener.options.once) {
        this.removeEventListener(event.type, listener.callback);
      }
    }
    return !event.defaultPrevented;
  }
}
/**
 * @see {@link https://www.npmjs.com/package/abortcontroller-polyfill}
 */
export class AbortSignal extends Emitter {
  aborted = false;
  onabort: ((event: Event) => void) | null = null;
  toString() {
    return '[object AbortSignal]';
  }
  dispatchEvent(event: Event) {
    if (event.type === 'abort') {
      this.aborted = true;
      if (typeof this.onabort === 'function') {
        this.onabort(event);
      }
    }

    return super.dispatchEvent(event);
  }
}
/**
 * @see {@link https://www.npmjs.com/package/abortcontroller-polyfill}
 */
export class AbortController {
  signal = new AbortSignal();
  abort() {
    let event = new Event('abort');
    this.signal.dispatchEvent(event);
  }
  toString() {
    return '[object AbortController]';
  }
}

export default AbortController;
