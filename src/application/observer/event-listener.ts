export interface EventListener<T> {
  handle(event: T): void | Promise<void>;
}
