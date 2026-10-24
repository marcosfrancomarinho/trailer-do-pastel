import { PrismaClient } from '@prisma/client';
import type { ListUsersOutput } from '../../application/dtos/users/list-users-dto.js';
import type { UserQueries } from '../../application/queries/user-queries.js';

export class PrismaUserQueries implements UserQueries {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(): Promise<ListUsersOutput> {
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, role: true, createdAt: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }));
  }
}
