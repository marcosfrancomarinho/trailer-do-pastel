import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaAdditionQueries } from '../../../../src/infrastructure/queries/prisma-addition-queries.js';

describe('PrismaAdditionQueries', () => {
  it('filters additions by product association and preserves decimal precision', async (context) => {
    const findMany = context.mock.fn(async () => [{
      id: 'addition-1',
      name: 'Queijo extra',
      price: new Prisma.Decimal('9007199254740993.01'),
      available: false,
    }]);
    const prisma = { addition: { findMany } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaAdditionQueries(prisma).findByProductId('product-1'), [{
      id: 'addition-1',
      name: 'Queijo extra',
      price: '9007199254740993.01',
      available: false,
    }]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      where: { deletedAt: null, products: { some: { productId: 'product-1' } } },
      select: { id: true, name: true, price: true, available: true },
      orderBy: { name: 'asc' },
    }]);
  });

  it('lists all additions without availability filters and preserves decimal precision', async (context) => {
    const findMany = context.mock.fn(async () => [{
      id: 'addition-1',
      name: 'Queijo extra',
      price: new Prisma.Decimal('9007199254740993.01'),
      available: false,
    }]);
    const prisma = { addition: { findMany } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaAdditionQueries(prisma).findAll(), [{
      id: 'addition-1',
      name: 'Queijo extra',
      price: '9007199254740993.01',
      available: false,
    }]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      where: { deletedAt: null },
      select: { id: true, name: true, price: true, available: true },
      orderBy: { name: 'asc' },
    }]);
  });

  it('returns an empty list when no additions are stored', async () => {
    const prisma = { addition: { findMany: async () => [] } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaAdditionQueries(prisma).findAll(), []);
  });
});
