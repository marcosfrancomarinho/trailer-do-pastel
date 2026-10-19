import type { AdditionListItem } from './list-additions-dto.js';

export interface ListAdditionsByProductInput {
  productId: string;
}

export type ListAdditionsByProductOutput = AdditionListItem[];
