import type { Addition } from '../entities/addition.js';

export interface AdditionRepository {
  findAdditionById(id: string): Promise<Addition | null>;
  existsByName(name: string): Promise<boolean>;
  save(addition: Addition): Promise<string>;
}
