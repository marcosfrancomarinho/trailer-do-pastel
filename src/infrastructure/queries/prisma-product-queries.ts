import { PrismaClient } from '@prisma/client';
import type { ProductListItem } from '../../application/dtos/list-products-dto.js';
import type { ProductQueries } from '../../application/queries/product-queries.js';

export class PrismaProductQueries implements ProductQueries {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(): Promise<ProductListItem[]> {
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        price: true,
        available: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      price: product.price.toString(),
      available: product.available,
    }));
  }

  public async findByCategoryId(categoryId: string): Promise<ProductListItem[]> {
    const products = await this.prisma.product.findMany({
      where: { categoryId },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        price: true,
        available: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      price: product.price.toString(),
      available: product.available,
    }));
  }
}
