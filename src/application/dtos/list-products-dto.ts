export interface ProductListItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: string;
  available: boolean;
}

export type ListProductsOutput = ProductListItem[];
