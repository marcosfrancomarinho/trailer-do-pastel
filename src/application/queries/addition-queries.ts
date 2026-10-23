import type { AdditionListItem } from '../dtos/additions/list-additions-dto.js';

export interface AdditionQueries {
  findAll(): Promise<AdditionListItem[]>;
  findByProductId(productId: string): Promise<AdditionListItem[]>;
}
