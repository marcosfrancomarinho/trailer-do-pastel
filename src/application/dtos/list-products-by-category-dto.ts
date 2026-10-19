import type { ProductListItem } from './list-products-dto.js';

export type { ProductListItem } from './list-products-dto.js';

export interface ListProductsByCategoryInput {
  categoryId: string;
}

export type ListProductsByCategoryOutput = ProductListItem[];
