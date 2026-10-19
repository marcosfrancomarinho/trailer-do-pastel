import { Category } from '../../domain/entities/category.js';
import type { CategoryRepository } from '../../domain/repositories/category-repository.js';
import { CategoryName } from '../../domain/value-objects/category/category-name.js';
import type { CreateCategoryInput, CreateCategoryOutput } from '../dtos/create-category-dto.js';
import { ApplicationError } from '../errors/application-error.js';

export class CreateCategory {
  public constructor(private readonly categoryRepository: CategoryRepository) {}

  public async create(input: CreateCategoryInput): Promise<CreateCategoryOutput> {
    const name = CategoryName.create(input.name);
    const categoryExists = await this.categoryRepository.existsByName(name.getValue());

    if (categoryExists) {
      throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');
    }
    const category = Category.create(name);
    const id = await this.categoryRepository.save(category);

    return { id };
  }
}
