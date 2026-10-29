import type { Addition } from '../entities/addition.js';

export interface AdditionRepository {
  findById(id: string): Promise<Addition | null>;
  isLinkedToProduct(productId: string, additionId: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  findByName(name: string): Promise<Addition | null>;
  reactivate(id: string, addition: Addition): Promise<string>;
  save(addition: Addition): Promise<string>;
  update(addition: Addition): Promise<void>;
  deleteById(id: string): Promise<void>;
}
