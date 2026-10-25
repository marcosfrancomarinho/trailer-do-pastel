import type { User } from '../entities/user.js';
import type { UserRole } from '../value-objects/user/user-role.js';

export interface UserRepository {
  findByName(name: string): Promise<User | null>;
  findRoleById(id: string): Promise<UserRole | null>;
  existsById(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  save(user: User): Promise<string>;
  deleteById(id: string): Promise<void>;
}
