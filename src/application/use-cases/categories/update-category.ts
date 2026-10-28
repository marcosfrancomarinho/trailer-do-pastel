import { Category } from '../../../domain/entities/category.js';
import type { CategoryRepository } from '../../../domain/repositories/category-repository.js';
import { CategoryName } from '../../../domain/value-objects/category/category-name.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { UpdateCategoryInput, UpdateCategoryOutput } from '../../dtos/categories/update-category-dto.js';

export class UpdateCategory {
  public constructor(private categoryRepository: CategoryRepository) {}

  public async update(input: UpdateCategoryInput): Promise<UpdateCategoryOutput> {
    const categoryId = ReferenceId.create(input.categoryId, 'categoryId');
    const name = CategoryName.create(input.name);
    const category = Category.create(name, categoryId.getValue());

    await this.categoryRepository.update(category);

    return { id: categoryId.getValue() };
  }
}
