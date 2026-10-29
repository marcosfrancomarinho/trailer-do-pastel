import type { CategoryRepository } from '../../../domain/repositories/category-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteCategoryInput } from '../../dtos/categories/delete-category-dto.js';

export class DeleteCategory {
  public constructor(private categories: CategoryRepository) {}

  public async delete(input: DeleteCategoryInput): Promise<void> {
    const categoryId: ReferenceId = ReferenceId.create(input.categoryId, 'categoryId');
    await this.categories.deleteById(categoryId.getValue());
  }
}
