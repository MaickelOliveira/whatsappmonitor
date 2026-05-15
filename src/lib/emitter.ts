import { EventEmitter } from "events";

declare global {
  var __emitter: EventEmitter | undefined;
}

const emitter = globalThis.__emitter ?? new EventEmitter();
globalThis.__emitter = emitter;
emitter.setMaxListeners(200);

export default emitter;
