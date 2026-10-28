import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';
import { isForeignKeyConstraintError } from './prisma-errors.js';
import type { Category } from '../../domain/entities/category.js';
import type { CategoryRepository } from '../../domain/repositories/category-repository.js';

export class PrismaCategoryRepository implements CategoryRepository {
  public constructor(private prisma: PrismaClient) {}

  public async existsById(id: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id },
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
    try {
      const savedCategory = await this.prisma.category.create({
        data: { name: category.getName() },
        select: { id: true },
      });

      return savedCategory.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');
      }

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
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        throw new ApplicationError('categoryId', 'IN_USE', 'A categoria não pode ser excluída porque possui produtos.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApplicationError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
        }

      }

      throw error;
    }
  }
}
