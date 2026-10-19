import type { AdditionListItem } from '../dtos/list-additions-dto.js';

export interface AdditionQueries {
  findAll(): Promise<AdditionListItem[]>;
  findByProductId(productId: string): Promise<AdditionListItem[]>;
}
