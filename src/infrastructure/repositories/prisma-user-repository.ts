import { Prisma, PrismaClient } from '@prisma/client';
import { InfrastructureError } from '../errors/infrastructure-error.js';
import { User } from '../../domain/entities/user.js';
import type { UserRepository } from '../../domain/repositories/user-repository.js';
import type { UserRole } from '../../domain/value-objects/user/user-role.js';
import { UserName } from '../../domain/value-objects/user/user-name.js';
import { UserPassword } from '../../domain/value-objects/user/user-password.js';

export class PrismaUserRepository implements UserRepository {
  public constructor(private prisma: PrismaClient) {}

  public async findByName(name: string): Promise<User | null> {
    const storedUser = await this.prisma.user.findUnique({
      where: { name },
      select: { id: true, name: true, password: true, role: true },
    });

    if (storedUser === null) {
      return null;
    }

    const userName = UserName.create(storedUser.name);
    const password = UserPassword.fromHash(storedUser.password);

    return User.create(userName, password, storedUser.role, storedUser.id);
  }

  public async existsByName(name: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { name },
      select: { id: true },
    });

    return user !== null;
  }

  public async existsById(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    return user !== null;
  }

  public async findRoleById(id: string): Promise<UserRole | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { role: true } });
    return user?.role ?? null;
  }

  public async save(user: User): Promise<string> {
    try {
      const savedUser = await this.prisma.user.create({
        data: {
          name: user.getName(),
          password: user.getPassword(),
          role: 'EMPLOYEE',
        },
        select: { id: true },
      });

      return savedUser.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe um usuário cadastrado com esse nome.');
      }

      throw error;
    }
  }

  public async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new InfrastructureError('userId', 'NOT_FOUND', 'O usuário informado não foi encontrado.');
      }
      throw error;
    }
  }
}
