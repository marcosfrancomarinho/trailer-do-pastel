import type { SseGateway } from '../gateways/sse-gateway.js';
import type { EventListener } from '../observer/event-listener.js';

export class SseListener implements EventListener<unknown> {
  public constructor(private sseGateway: SseGateway) {}

  public async handle(event: unknown): Promise<void> {
    await this.sseGateway.send(event);
  }
}
