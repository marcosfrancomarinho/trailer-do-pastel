import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaOrderQueries } from '../src/infrastructure/queries/prisma-order-queries.js';

describe('PrismaOrderQueries', () => {
  it('returns only pending orders with item details, ordered oldest first', async (context) => {
    const findMany = context.mock.fn(async () => [{
      id: 'order-1',
      customerName: 'Maria Silva',
      customerPhone: '11999999999',
      status: 'PENDING',
      total: new Prisma.Decimal('9007199254740993.01'),
      createdAt: new Date('2026-10-19T10:00:00.000Z'),
      items: [{
        productId: 'product-1',
        productName: 'Pastel de queijo',
        quantity: 2,
        unitPrice: new Prisma.Decimal('12.50'),
        additions: [{
          additionId: 'addition-1',
          quantity: 1,
          unitPrice: new Prisma.Decimal('2.50'),
          addition: { name: 'Queijo extra' },
        }],
      }],
    }]);
    const prisma = { order: { findMany } } as unknown as PrismaClient;

    const result = await new PrismaOrderQueries(prisma).findPending();

    assert.deepEqual(result, [{
      id: 'order-1',
      customerName: 'Maria Silva',
      customerPhone: '11999999999',
      status: 'PENDING',
      total: '9007199254740993.01',
      createdAt: '2026-10-19T10:00:00.000Z',
      items: [{
        productId: 'product-1',
        productName: 'Pastel de queijo',
        quantity: 2,
        unitPrice: '12.5',
        additions: [{ additionId: 'addition-1', additionName: 'Queijo extra', quantity: 1, unitPrice: '2.5' }],
      }],
    }]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      where: { status: 'PENDING' },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            additions: {
              select: {
                additionId: true,
                quantity: true,
                unitPrice: true,
                addition: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }]);
  });

  it('returns an empty list when there are no pending orders', async () => {
    const prisma = { order: { findMany: async () => [] } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaOrderQueries(prisma).findPending(), []);
  });
});
