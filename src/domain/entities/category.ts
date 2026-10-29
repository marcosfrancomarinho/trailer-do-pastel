import { DomainError } from '../errors/domain-error.js';
import type { CategoryName } from '../value-objects/category/category-name.js';

export class Category {
  private constructor(
    private name: CategoryName,
    private id: string | undefined,
    private deletedAt: Date | null = null,
  ) {}

  public static create(name: CategoryName, id?: string, deletedAt: Date | null = null): Category {
    return new Category(name, id, deletedAt);
  }

  public isActive(): boolean {
    return this.deletedAt === null;
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
