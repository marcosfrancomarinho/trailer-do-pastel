import type { Category } from '../entities/category.js';

export interface CategoryRepository {
  existsByName(name: string): Promise<boolean>;
  save(category: Category): Promise<string>;
}
