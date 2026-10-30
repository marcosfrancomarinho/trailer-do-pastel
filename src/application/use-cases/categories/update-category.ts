import { Category } from '../../../domain/entities/category.js';
import type { CategoryRepository } from '../../../domain/repositories/category-repository.js';
import { CategoryName } from '../../../domain/value-objects/category/category-name.js';
import { CategorySortOrder } from '../../../domain/value-objects/category/category-sort-order.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateCategoryInput, UpdateCategoryOutput } from '../../dtos/categories/update-category-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class UpdateCategory {
  public constructor(private categories: CategoryRepository) {}

  public async update(input: UpdateCategoryInput): Promise<UpdateCategoryOutput> {
    const categoryId: ReferenceId = ReferenceId.create(input.categoryId, 'categoryId');
    const categoryExists: boolean = await this.categories.existsById(categoryId.getValue());

    if (!categoryExists) {
      throw new ApplicationError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
    }

    const name: CategoryName = CategoryName.create(input.name);
    let sortOrder: CategorySortOrder | undefined;
    if (input.sortOrder !== undefined) {
      sortOrder = CategorySortOrder.create(input.sortOrder);
    }
    const category: Category = Category.create(name, sortOrder, categoryId.getValue());

    await this.categories.update(category);

    return { id: categoryId.getValue() };
  }
}
