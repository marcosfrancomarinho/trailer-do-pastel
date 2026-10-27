import type { EventListener } from './event-listener.js';

export class EventObserver {
  private readonly listeners = new Set<EventListener<unknown>>();

  public register<T>(listener: EventListener<T>): void {
    this.listeners.add(listener);
  }

  public unregister<T>(listener: EventListener<T>): void {
    this.listeners.delete(listener);
  }

  public async notify<T>(event: T): Promise<void> {
    for (const listener of this.listeners) {
      await listener.handle(event);
    }
  }
}
