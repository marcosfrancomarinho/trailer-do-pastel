import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import type { User } from '../../domain/entities/user.js';
import type { UserRepository } from '../../domain/repositories/user-repository.js';

export class PrismaUserRepository implements UserRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async existsByName(name: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { name },
      select: { id: true },
    });

    return user !== null;
  }

  public async save(user: User): Promise<string> {
    try {
      const savedUser = await this.prisma.user.create({
        data: {
          name: user.getName(),
          password: user.getPassword(),
        },
        select: { id: true },
      });

      return savedUser.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um usuário cadastrado com esse nome.');
      }

      throw error;
    }
  }
}
