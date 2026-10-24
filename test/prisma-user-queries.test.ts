import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { PrismaUserQueries } from '../src/infrastructure/queries/prisma-user-queries.js';

describe('PrismaUserQueries', () => {
  it('lists only IDs, names, roles and dates in stable order', async (context) => {
    const findMany = context.mock.fn(async () => [{
      id: 'user-1', name: 'Marcos', role: 'ADMIN', createdAt: new Date('2026-10-23T10:00:00.000Z'),
    }]);
    const prisma = { user: { findMany } } as unknown as PrismaClient;
    assert.deepEqual(await new PrismaUserQueries(prisma).findAll(), [
      { id: 'user-1', name: 'Marcos', role: 'ADMIN', createdAt: '2026-10-23T10:00:00.000Z' },
    ]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      select: { id: true, name: true, role: true, createdAt: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    }]);
  });
});
