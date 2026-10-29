import { PrismaClient } from '@prisma/client';
import type { Addition as PrismaAddition } from '@prisma/client';
import type { AdditionListItem } from '../../application/dtos/additions/list-additions-dto.js';
import type { AdditionQueries } from '../../application/queries/addition-queries.js';

type AdditionListRecord = Pick<PrismaAddition, 'id' | 'name' | 'price' | 'available'>;

export class PrismaAdditionQueries implements AdditionQueries {
  public constructor(private prisma: PrismaClient) {}

  public async findAll(): Promise<AdditionListItem[]> {
    const additions = await this.prisma.addition.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        price: true,
        available: true,
      },
      orderBy: { name: 'asc' },
    });

    return additions.map(
      (addition): AdditionListItem => ({
        id: addition.id,
        name: addition.name,
        price: addition.price.toString(),
        available: addition.available,
      }),
    );
  }

  public async findByProductId(productId: string): Promise<AdditionListItem[]> {
    const additions: AdditionListRecord[] = await this.prisma.addition.findMany({
      where: {
        deletedAt: null,
        products: {
          some: { productId },
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        available: true,
      },
      orderBy: { name: 'asc' },
    });

    return additions.map(
      (addition): AdditionListItem => ({
        id: addition.id,
        name: addition.name,
        price: addition.price.toString(),
        available: addition.available,
      }),
    );
  }
}
