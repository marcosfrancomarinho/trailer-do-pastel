import { DomainError } from '../../errors/domain-error.js';

export class OrderObservation {
  private constructor(private readonly value: string | null) {}

  public static create(value?: unknown): OrderObservation {
    if (value === undefined || value === null) return new OrderObservation(null);

    if (typeof value !== 'string') {
      throw new DomainError('observation', 'INVALID_TYPE', 'A observação do pedido deve ser um texto.');
    }

    const observation = value.trim();
    if (!observation) return new OrderObservation(null);

    if (observation.length > 500) {
      throw new DomainError('observation', 'TOO_LONG', 'A observação do pedido deve ter no máximo 500 caracteres.');
    }

    return new OrderObservation(observation);
  }

  public getValue(): string | null {
    return this.value;
  }
}
