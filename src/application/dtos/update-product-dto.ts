export interface UpdateProductInput {
  productId: string;
  name?: string;
  description?: string;
  categoryId?: string;
  price?: string;
  available?: boolean;
  additionIds?: string[];
}

export interface UpdateProductOutput {
  id: string;
}
