import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaProductQueries } from '../src/infrastructure/queries/prisma-product-queries.js';

describe('PrismaProductQueries', () => {
  it('filters by category and keeps decimal precision in the read DTO', async (context) => {
    const findMany = context.mock.fn(async () => [{
      id: 'product-1',
      name: 'Pastel especial',
      description: 'Recheio especial',
      categoryId: 'category-1',
      price: new Prisma.Decimal('9007199254740993.01'),
      available: false,
    }]);
    const prisma = { product: { findMany } } as unknown as PrismaClient;
    const queries = new PrismaProductQueries(prisma);

    const result = await queries.findByCategoryId('category-1');

    assert.deepEqual(result, [{
      id: 'product-1',
      name: 'Pastel especial',
      description: 'Recheio especial',
      categoryId: 'category-1',
      price: '9007199254740993.01',
      available: false,
    }]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      where: { categoryId: 'category-1' },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        price: true,
        available: true,
      },
      orderBy: { name: 'asc' },
    }]);
  });
});
