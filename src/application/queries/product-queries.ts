import type { ProductListItem } from '../dtos/list-products-by-category-dto.js';

export interface ProductQueries {
  findByCategoryId(categoryId: string): Promise<ProductListItem[]>;
}
