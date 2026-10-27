import type { Response } from 'express';
import type { SseGateway } from '../../../application/gateways/sse-gateway.js';

export class HttpSseGateway implements SseGateway {
  private readonly clients = new Map<Response, NodeJS.Timeout>();

  public connect(response: Response): void {
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
    this.clients.set(response, heartbeat);

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

    for (const response of this.clients.keys()) {
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
    clearInterval(this.clients.get(response));
    this.clients.delete(response);
  }
}
