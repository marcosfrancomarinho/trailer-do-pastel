import type { Category } from '../entities/category.js';

export interface CategoryRepository {
  findByName(name: string): Promise<Category | null>;
  reactivate(id: string): Promise<string>;
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  save(category: Category): Promise<string>;
  update(category: Category, sortOrder?: number): Promise<void>;
  deleteById(id: string): Promise<void>;
}
