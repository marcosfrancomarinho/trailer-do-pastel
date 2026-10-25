import { PrismaClient } from '@prisma/client';
import type { CategoryListItem } from '../../application/dtos/categories/list-categories-dto.js';
import type { CategoryQueries } from '../../application/queries/category-queries.js';

export class PrismaCategoryQueries implements CategoryQueries {
  public constructor(private prisma: PrismaClient) {}

  public async findAll(): Promise<CategoryListItem[]> {
    return this.prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}
