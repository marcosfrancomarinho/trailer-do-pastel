import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { PrismaCategoryQueries } from '../../../../src/infrastructure/queries/prisma-category-queries.js';

describe('PrismaCategoryQueries', () => {
  for (const result of [[], [{ id: 'category-1', name: 'Pasteis' }]]) {
    it(`lists ${result.length} categories ordered by name with public fields only`, async (context) => {
      const findMany = context.mock.fn(async (_input: unknown) => result);
      const prisma = { category: { findMany } } as unknown as PrismaClient;
      assert.strictEqual(await new PrismaCategoryQueries(prisma).findAll(), result);
      assert.deepEqual(findMany.mock.calls.map(call => call.arguments), [[{
        select: { id: true, name: true, sortOrder: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }]]);
    });
  }
  it('preserves database errors', async () => {
    const failure = new Error('Database unavailable');
    const prisma = { category: { findMany: async () => { throw failure; } } } as unknown as PrismaClient;
    await assert.rejects(new PrismaCategoryQueries(prisma).findAll(), (error: unknown) => error === failure);
  });
});
