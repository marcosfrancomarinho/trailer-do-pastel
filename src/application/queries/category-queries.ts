import type { CategoryListItem } from '../dtos/list-categories-dto.js';

export interface CategoryQueries {
  findAll(): Promise<CategoryListItem[]>;
}
