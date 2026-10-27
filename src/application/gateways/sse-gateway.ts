export interface SseGateway {
  send(event: unknown): void | Promise<void>;
}
