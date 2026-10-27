import type { Response } from 'express';
import type { SseGateway } from '../../../application/gateways/sse-gateway.js';

export class HttpSseGateway implements SseGateway {
  private readonly clients = new Map<Response, { heartbeat: NodeJS.Timeout; orderId: string | null }>();

  public connect(response: Response, orderId: string | null = null): void {
    if (this.clients.has(response) || response.destroyed || response.writableEnded) return;

    response.status(200);
    response.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    response.flushHeaders();

    const heartbeat = setInterval(() => this.write(response, ': heartbeat\n\n'), 25_000);
    heartbeat.unref();
    this.clients.set(response, { heartbeat, orderId });

    response.once('close', () => this.disconnect(response));
    response.once('error', () => {
      this.disconnect(response);
      response.destroy();
    });

    this.write(response, ': connected\n\n');
  }

  public send(event: unknown): void {
    const data = JSON.stringify(event);
    if (data === undefined) return;

    const eventOrderId = event && typeof event === 'object' && 'orderId' in event ? (event as { orderId?: unknown }).orderId : null;
    for (const [response, client] of this.clients) {
      if (client.orderId !== null && client.orderId !== eventOrderId) continue;
      this.write(response, `data: ${data}\n\n`);
    }
  }

  private write(response: Response, message: string): void {
    if (response.destroyed || response.writableEnded) {
      this.disconnect(response);
      return;
    }

    try {
      if (response.write(message)) return;
    } catch {
      // Uma conexão com falha não deve interromper o envio aos demais clientes.
    }

    this.disconnect(response);
    response.destroy();
  }

  private disconnect(response: Response): void {
    const client = this.clients.get(response);
    if (client) clearInterval(client.heartbeat);
    this.clients.delete(response);
  }
}
