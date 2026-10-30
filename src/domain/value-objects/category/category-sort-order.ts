import { DomainError } from '../../errors/domain-error.js';

export class CategorySortOrder {
  private constructor(private value: number) {}

  public static create(value: unknown): CategorySortOrder {
    if (value === undefined || value === null) {
      throw new DomainError('sortOrder', 'REQUIRED', 'A posição da categoria é obrigatória.');
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new DomainError('sortOrder', 'INVALID_TYPE', 'A posição da categoria deve ser um número válido.');
    }
    if (!Number.isFinite(value)) {
      throw new DomainError('sortOrder', 'NOT_FINITE', 'A posição da categoria deve ser finita.');
    }
    if (!Number.isInteger(value)) {
      throw new DomainError('sortOrder', 'INVALID_INTEGER', 'A posição da categoria deve ser inteira.');
    }
    if (value < 0) {
      throw new DomainError('sortOrder', 'NEGATIVE', 'A posição da categoria não pode ser negativa.');
    }
    if (value > 2147483647) {
      throw new DomainError('sortOrder', 'TOO_LARGE', 'A posição da categoria não pode ultrapassar 2147483647.');
    }

    return new CategorySortOrder(value);
  }

  public static nextAfter(maxSortOrder: number | null): CategorySortOrder {
    const currentSortOrder: CategorySortOrder = CategorySortOrder.create(maxSortOrder ?? 0);
    const nextSortOrder: number = currentSortOrder.getValue() + 1;
    return CategorySortOrder.create(nextSortOrder);
  }

  public getValue(): number {
    return this.value;
  }
}
