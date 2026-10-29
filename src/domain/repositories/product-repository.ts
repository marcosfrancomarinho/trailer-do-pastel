import type { Addition } from '../entities/addition.js';
import type { Product } from '../entities/product.js';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  save(product: Product, additions: Addition[]): Promise<string>;
  update(product: Product, additions?: Addition[]): Promise<void>;
  deleteById(id: string): Promise<void>;
}
