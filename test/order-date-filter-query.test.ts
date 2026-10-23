import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { PrismaOrderQueries } from '../src/infrastructure/queries/prisma-order-queries.js';
import { orderDateRange } from '../src/application/dtos/orders/order-date-range.js';

const range = orderDateRange('2026-10-22');

for (const [method, statuses] of [
  ['findPending', 'PENDING'],
  ['findPreparing', { in: ['CONFIRMED', 'PREPARING'] }],
  ['findHistory', { in: ['COMPLETED', 'CANCELED'] }],
] as const) {
  describe(method, () => {
    it('filters by status and day of creation', async (context) => {
      const findMany = context.mock.fn(async () => []);
      const prisma = { order: { findMany } } as unknown as PrismaClient;
      const queries = new PrismaOrderQueries(prisma);
      await queries[method](range);
      assert.deepEqual(findMany.mock.calls[0].arguments[0].where, {
        status: statuses,
        createdAt: { gte: range.start, lt: range.end },
      });
    });
  });
}
