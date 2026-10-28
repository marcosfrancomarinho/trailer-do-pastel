import type { Response } from 'express';

export interface SseGateway {
  connect(response: Response, orderId?: string | null, storeOnly?: boolean): void;
  send(event: unknown): void | Promise<void>;
}
