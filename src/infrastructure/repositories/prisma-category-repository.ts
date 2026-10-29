import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import type { Category } from '../../domain/entities/category.js';
import type { CategoryRepository } from '../../domain/repositories/category-repository.js';

export class PrismaCategoryRepository implements CategoryRepository {
  public constructor(private prisma: PrismaClient) {}

  public async existsById(id: string): Promise<boolean> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    return category !== null;
  }

  public async existsByName(name: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { name },
      select: { id: true },
    });

    return category !== null;
  }

  public async save(category: Category): Promise<string> {
    const name = category.getName();
    const conflict = () => new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');

    try {
      const existing = await this.prisma.category.findUnique({
        where: { name },
        select: { id: true, deletedAt: true },
      });
      if (existing) {
        if (existing.deletedAt === null) throw conflict();
        const result = await this.prisma.category.updateMany({
          where: { id: existing.id, deletedAt: { not: null } },
          data: { deletedAt: null },
        });
        if (result.count !== 1) throw conflict();
        return existing.id;
      }
      const created = await this.prisma.category.create({
        data: { name },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw conflict();
      throw error;
    }
  }

  public async update(category: Category): Promise<void> {
    try {
      await this.prisma.category.update({
        where: { id: category.getId() },
        data: { name: category.getName() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');
        }

        if (error.code === 'P2025') {
          throw new ApplicationError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
        }
      }

      throw error;
    }
  }

  public async deleteById(id: string): Promise<void> {
    try {
      await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
        }

      }

      throw error;
    }
  }
}
