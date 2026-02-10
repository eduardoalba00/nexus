import { EventEmitter } from "events";

export class PubSub {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(0);
  }

  publish(topic: string, message: unknown): void {
    this.emitter.emit(topic, message);
  }

  subscribe(topic: string, handler: (message: unknown) => void): void {
    this.emitter.on(topic, handler);
  }

  unsubscribe(topic: string, handler: (message: unknown) => void): void {
    this.emitter.off(topic, handler);
  }
}
