import { DomainError } from '../../errors/domain-error.js';

export class TableNumber {
  private constructor(private value: number) {}

  public static create(value: unknown): TableNumber {
    if (value === undefined || value === null) {
      throw new DomainError('number', 'REQUIRED', 'O número da mesa é obrigatório.');
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new DomainError('number', 'INVALID_TYPE', 'O número da mesa deve ser um número válido.');
    }
    if (!Number.isFinite(value)) {
      throw new DomainError('number', 'NOT_FINITE', 'O número da mesa deve ser finito.');
    }
    if (!Number.isInteger(value)) {
      throw new DomainError('number', 'INVALID_INTEGER', 'O número da mesa deve ser inteiro.');
    }
    if (value <= 0) {
      throw new DomainError('number', 'NON_POSITIVE', 'O número da mesa deve ser maior que zero.');
    }
    if (value > 2147483647) {
      throw new DomainError('number', 'TOO_LARGE', 'O número da mesa não pode ultrapassar 2147483647.');
    }
    return new TableNumber(value);
  }

  public getValue(): number {
    return this.value;
  }
}
