import type { User } from '../entities/user.js';

export interface UserRepository {
  findByName(name: string): Promise<User | null>;
  existsByName(name: string): Promise<boolean>;
  save(user: User): Promise<string>;
}
