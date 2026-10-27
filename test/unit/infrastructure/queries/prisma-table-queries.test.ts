import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaTableQueries } from '../../../../src/infrastructure/queries/prisma-table-queries.js';

describe('PrismaTableQueries', () => {
  it('lists mesas by number with their current status and total', async (context) => {
    const findMany = context.mock.fn(async () => [
      { id: 'table-1', number: 1, status: 'OCCUPIED', totalSpent: new Prisma.Decimal('35.50') },
      { id: 'table-2', number: 2, status: 'FREE', totalSpent: new Prisma.Decimal('0') },
    ]);
    const prisma = { table: { findMany } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaTableQueries(prisma).findAll(), [
      { id: 'table-1', number: 1, status: 'OCCUPIED', totalSpent: '35.5' },
      { id: 'table-2', number: 2, status: 'FREE', totalSpent: '0' },
    ]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      where: { deletedAt: null },
      select: { id: true, number: true, status: true, totalSpent: true },
      orderBy: [{ number: 'asc' }, { id: 'asc' }],
    }]);
  });
});
