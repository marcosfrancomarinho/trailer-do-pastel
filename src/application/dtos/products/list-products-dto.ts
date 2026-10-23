export interface ProductListItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: string;
  imageUrl: string | null;
  available: boolean;
}

export type ListProductsOutput = ProductListItem[];
