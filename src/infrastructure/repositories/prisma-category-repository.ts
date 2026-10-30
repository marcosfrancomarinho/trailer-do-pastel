import type { Category as PrismaCategory } from '@prisma/client';
import { CategoryName } from '../../domain/value-objects/category/category-name.js';
import { CategorySortOrder } from '../../domain/value-objects/category/category-sort-order.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { InfrastructureError } from '../errors/infrastructure-error.js';
import { Category } from '../../domain/entities/category.js';
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

  public async findByName(name: string): Promise<Category | null> {
    const category: PrismaCategory | null = await this.prisma.category.findUnique({ where: { name } });

    if (category === null) return null;

    const categoryName: CategoryName = CategoryName.create(category.name);
    return Category.create(categoryName, CategorySortOrder.create(category.sortOrder), category.id, category.deletedAt);
  }

  public async findMaxSortOrder(): Promise<number | null> {
    const last: { _max: { sortOrder: number | null } } = await this.prisma.category.aggregate({ _max: { sortOrder: true } });
    return last._max.sortOrder;
  }

  public async save(category: Category): Promise<string> {
    try {
      const created: { id: string } = await this.prisma.category.create({
        data: { name: category.getName(), sortOrder: category.getRequiredSortOrder() },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');
      }
      throw error;
    }
  }

  public async reactivate(id: string): Promise<string> {
    const result: Prisma.BatchPayload = await this.prisma.category.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null },
    });

    if (result.count !== 1) {
      throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');
    }

    return id;
  }

  public async update(category: Category): Promise<void> {
    try {
      const sortOrder: number | undefined = category.getSortOrder();
      await this.prisma.category.update({
        where: { id: category.getId() },
        data: { name: category.getName(), ...(sortOrder === undefined ? {} : { sortOrder }) },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new InfrastructureError('name', 'ALREADY_EXISTS', 'Já existe uma categoria cadastrada com esse nome.');
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
          throw new InfrastructureError('categoryId', 'NOT_FOUND', 'A categoria informada não foi encontrada.');
        }
      }

      throw error;
    }
  }
}
