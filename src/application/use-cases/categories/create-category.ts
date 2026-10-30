import { Category } from '../../../domain/entities/category.js';
import { ApplicationError } from '../../errors/application-error.js';
import type { CategoryRepository } from '../../../domain/repositories/category-repository.js';
import { CategoryName } from '../../../domain/value-objects/category/category-name.js';
import { CategorySortOrder } from '../../../domain/value-objects/category/category-sort-order.js';
import type { CreateCategoryInput, CreateCategoryOutput } from '../../dtos/categories/create-category-dto.js';

export class CreateCategory {
  public constructor(private categories: CategoryRepository) {}

  public async create(input: CreateCategoryInput): Promise<CreateCategoryOutput> {
    const name: CategoryName = CategoryName.create(input.name);
    const existing: Category | null = await this.categories.findByName(name.getValue());

    if (existing && existing.isActive()) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');
    }

    if (existing) {
      const id: string = await this.categories.reactivate(existing.getId());
      return { id };
    }

    const maxSortOrder: number | null = await this.categories.findMaxSortOrder();
    const sortOrder: CategorySortOrder = CategorySortOrder.nextAfter(maxSortOrder);
    const category: Category = Category.create(name, sortOrder);
    const id: string = await this.categories.save(category);

    return { id };
  }
}
