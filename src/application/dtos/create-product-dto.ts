export interface CreateProductInput {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  available?: boolean;
  additionIds?: string[];
}

export interface CreateProductOutput {
  id: string;
}
