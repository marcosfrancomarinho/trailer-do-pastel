import type { User } from '../entities/user.js';

export interface UserRepository {
  existsByName(name: string): Promise<boolean>;
  save(user: User): Promise<string>;
}
