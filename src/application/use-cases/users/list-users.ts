import type { ListUsersOutput } from '../../dtos/users/list-users-dto.js';
import type { UserQueries } from '../../queries/user-queries.js';

export class ListUsers {
  public constructor(private users: UserQueries) {}

  public list(): Promise<ListUsersOutput> {
    return this.users.findAll();
  }
}
