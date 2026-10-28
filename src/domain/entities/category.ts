import { DomainError } from '../errors/domain-error.js';
import type { CategoryName } from '../value-objects/category/category-name.js';

export class Category {
  private constructor(
    private name: CategoryName,
    private id: string | undefined,
    private sortOrder = 0,
    private sortOrder: number = 0,
  ) {}

  public static create(name: CategoryName, id?: string, sortOrder = 0): Category {
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) throw new DomainError('sortOrder', 'INVALID', 'A ordem deve ser um número inteiro não negativo.');
    return new Category(name, id, sortOrder);
  }

  public getId(): string {
    if (this.id === undefined) {
      throw new DomainError('id', 'REQUIRED', 'A categoria ainda não possui um ID.');
    }

    return this.id;
  }

  public getSortOrder(): number { return this.sortOrder; }

  public getSortOrder(): number { return this.sortOrder; }

  public getName(): string {
    return this.name.getValue();
  }
}
