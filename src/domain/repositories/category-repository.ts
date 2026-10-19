import type { Category } from '../entities/category.js';

export interface CategoryRepository {
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  save(category: Category): Promise<string>;
}
