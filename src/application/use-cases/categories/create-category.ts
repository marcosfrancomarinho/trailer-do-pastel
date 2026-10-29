import { Category } from '../../../domain/entities/category.js';
import type { CategoryRepository } from '../../../domain/repositories/category-repository.js';
import { CategoryName } from '../../../domain/value-objects/category/category-name.js';
import type { CreateCategoryInput, CreateCategoryOutput } from '../../dtos/categories/create-category-dto.js';

export class CreateCategory {
  public constructor(private categoryRepository: CategoryRepository) {}

  public async create(input: CreateCategoryInput): Promise<CreateCategoryOutput> {
    const name = CategoryName.create(input.name);
    const category = Category.create(name);
    const id = await this.categoryRepository.save(category);

    return { id };
  }
}
