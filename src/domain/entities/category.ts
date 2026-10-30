import { DomainError } from '../errors/domain-error.js';
import type { CategoryName } from '../value-objects/category/category-name.js';
import type { CategorySortOrder } from '../value-objects/category/category-sort-order.js';

export class Category {
  private constructor(
    private name: CategoryName,
    private sortOrder: CategorySortOrder | undefined,
    private id: string | undefined,
    private deletedAt: Date | null = null,
  ) {}

  public static create(
    name: CategoryName,
    sortOrder?: CategorySortOrder,
    id?: string,
    deletedAt: Date | null = null,
  ): Category {
    return new Category(name, sortOrder, id, deletedAt);
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

  public getSortOrder(): number | undefined {
    return this.sortOrder?.getValue();
  }

  public getRequiredSortOrder(): number {
    if (this.sortOrder === undefined) {
      throw new DomainError('sortOrder', 'REQUIRED', 'A posição da categoria é obrigatória.');
    }

    return this.sortOrder.getValue();
  }
}
