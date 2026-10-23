import type { Addition } from '../entities/addition.js';

export interface AdditionRepository {
  findAdditionById(id: string): Promise<Addition | null>;
  isLinkedToProduct(productId: string, additionId: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  save(addition: Addition): Promise<string>;
  update(addition: Addition): Promise<void>;
  deleteById(id: string): Promise<void>;
}
