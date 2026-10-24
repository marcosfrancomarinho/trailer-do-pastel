import type { ListUsersOutput } from '../dtos/users/list-users-dto.js';

export interface UserQueries {
  findAll(): Promise<ListUsersOutput>;
}
