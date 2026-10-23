import type { CategoryListItem } from '../dtos/categories/list-categories-dto.js';

export interface CategoryQueries {
  findAll(): Promise<CategoryListItem[]>;
}
