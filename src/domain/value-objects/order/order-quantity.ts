import { DomainError } from '../../errors/domain-error.js';

export class OrderQuantity {
  private constructor(private readonly quantity: number) {}

  public static create(quantity: number): OrderQuantity {
    OrderQuantity.validate(quantity);
    return new OrderQuantity(quantity);
  }

  public getValue(): number {
    return this.quantity;
  }

  private static validate(quantity: unknown): void {
    if (quantity === undefined || quantity === null) {
      throw new DomainError('quantity', 'REQUIRED', 'A quantidade não pode ser nula ou indefinida.');
    }

    if (typeof quantity !== 'number' || Number.isNaN(quantity)) {
      throw new DomainError('quantity', 'INVALID_TYPE', 'A quantidade deve ser um número válido.');
    }

    if (!Number.isFinite(quantity)) {
      throw new DomainError('quantity', 'NOT_FINITE', 'A quantidade deve ser finita.');
    }

    if (!Number.isInteger(quantity)) {
      throw new DomainError('quantity', 'INVALID_INTEGER', 'A quantidade deve ser um número inteiro.');
    }

    if (quantity <= 0) {
      throw new DomainError('quantity', 'NON_POSITIVE', 'A quantidade deve ser maior que zero.');
    }

    if (quantity > 2147483647) {
      throw new DomainError('quantity', 'TOO_LARGE', 'A quantidade não pode ultrapassar 2147483647.');
    }
  }
}
