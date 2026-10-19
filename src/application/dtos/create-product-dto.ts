export interface CreateProductInput {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  available?: boolean;
}

export interface CreateProductOutput {
  id: string;
}
