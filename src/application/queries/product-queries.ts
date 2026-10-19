import type { ProductListItem } from '../dtos/list-products-dto.js';

export interface ProductQueries {
  findAll(): Promise<ProductListItem[]>;
  findByCategoryId(categoryId: string): Promise<ProductListItem[]>;
}
