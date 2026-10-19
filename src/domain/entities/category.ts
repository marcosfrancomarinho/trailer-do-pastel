import { DomainError } from '../errors/domain-error.js';
import type { CategoryName } from '../value-objects/category/category-name.js';

export class Category {
  private constructor(
    private readonly name: CategoryName,
    private readonly id: string | undefined,
  ) {}

  public static create(name: CategoryName, id?: string): Category {
    return new Category(name, id);
  }

  public getId(): string {
    if (this.id === undefined) {
      throw new DomainError('id', 'REQUIRED', 'A categoria ainda não possui um ID.');
    }

    return this.id;
  }

  public getName(): string {
    return this.name.getValue();
  }
}
