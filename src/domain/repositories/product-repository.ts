import type { Product } from '../entities/product.js';

export interface ProductRepository {
  findProductById(id: string): Promise<Product | null>;
  existsByName(name: string): Promise<boolean>;
  save(product: Product): Promise<string>;
}
