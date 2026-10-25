import { PrismaClient } from '@prisma/client';
import type { AdditionListItem } from '../../application/dtos/additions/list-additions-dto.js';
import type { AdditionQueries } from '../../application/queries/addition-queries.js';

export class PrismaAdditionQueries implements AdditionQueries {
  public constructor(private prisma: PrismaClient) {}

  public async findAll(): Promise<AdditionListItem[]> {
    const additions = await this.prisma.addition.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        available: true,
      },
      orderBy: { name: 'asc' },
    });

    return additions.map((addition) => ({
      id: addition.id,
      name: addition.name,
      price: addition.price.toString(),
      available: addition.available,
    }));
  }

  public async findByProductId(productId: string): Promise<AdditionListItem[]> {
    const additions = await this.prisma.addition.findMany({
      where: { products: { some: { productId } } },
      select: {
        id: true,
        name: true,
        price: true,
        available: true,
      },
      orderBy: { name: 'asc' },
    });

    return additions.map((addition) => ({
      id: addition.id,
      name: addition.name,
      price: addition.price.toString(),
      available: addition.available,
    }));
  }
}
