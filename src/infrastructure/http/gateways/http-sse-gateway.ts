import type { Response } from 'express';
import type { SseGateway } from '../../../application/gateways/sse-gateway.js';

interface SseClient {
  heartbeat: NodeJS.Timeout;
  orderId: string | null;
  storeOnly: boolean;
}

export class HttpSseGateway implements SseGateway {
  private readonly clients: Map<Response, SseClient> = new Map();

  public connect(response: Response, orderId: string | null = null, storeOnly: boolean = false): void {
    const alreadyConnected: boolean = this.clients.has(response);
    const connectionClosed: boolean = response.destroyed || response.writableEnded;

    if (alreadyConnected || connectionClosed) {
      return;
    }

    response.status(200);
    response.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    response.flushHeaders();

    const heartbeat: NodeJS.Timeout = setInterval(() => this.write(response, ': heartbeat\n\n'), 25_000);
    heartbeat.unref();
    this.clients.set(response, { heartbeat, orderId, storeOnly });

    response.once('close', () => this.disconnect(response));
    response.once('error', () => {
      this.disconnect(response);
      response.destroy();
    });

    this.write(response, ': connected\n\n');
  }

  public send(event: unknown): void {
    const data: string | undefined = JSON.stringify(event);

    if (data === undefined) {
      return;
    }

    let isStoreEvent: boolean = false;
    let eventOrderId: unknown = null;

    if (event !== null && typeof event === 'object') {
      const eventType: string = 'type' in event ? String(event.type) : '';
      isStoreEvent = eventType === 'STORE_OPENED' || eventType === 'STORE_CLOSED';
      eventOrderId = 'orderId' in event ? event.orderId : null;
    }

    const message: string = `data: ${data}\n\n`;

    for (const [response, client] of this.clients) {
      const storeMismatch: boolean = client.storeOnly && isStoreEvent === false;
      const tracksOrder: boolean = client.orderId !== null;
      const orderMismatch: boolean = tracksOrder && (client.orderId !== eventOrderId || isStoreEvent);

      if (storeMismatch || orderMismatch) {
        continue;
      }

      this.write(response, message);
    }
  }

  private write(response: Response, message: string): void {
    if (response.destroyed || response.writableEnded) {
      this.disconnect(response);
      return;
    }

    try {
      const messageAccepted: boolean = response.write(message);

      if (messageAccepted) {
        return;
      }
    } catch {
      // Uma conexão com falha não deve interromper o envio aos demais clientes.
    }

    this.disconnect(response);
    response.destroy();
  }

  private disconnect(response: Response): void {
    const client: SseClient | undefined = this.clients.get(response);

    if (client) {
      clearInterval(client.heartbeat);
    }

    this.clients.delete(response);
  }
}
