import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { PrismaStoreRepository } from '../src/infrastructure/repositories/prisma-store-repository.js';

describe('PrismaStoreRepository', () => {
  it('reads the public status and persists opening and closing', async (context) => {
    const updatedAt = new Date('2026-10-23T12:00:00.000Z');
    const findUnique = context.mock.fn(async () => ({ status: 'OPEN', updatedAt }));
    const update = context.mock.fn(async ({ data }: { data: { status: 'OPEN' | 'CLOSED' } }) =>
      ({ status: data.status, updatedAt }));
    const prisma = { store: { findUnique, update } } as unknown as PrismaClient;
    const repository = new PrismaStoreRepository(prisma);

    assert.deepEqual(await repository.getStatus(), { status: 'OPEN', updatedAt: updatedAt.toISOString() });
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { id: 1 }, select: { status: true, updatedAt: true },
    }]);
    assert.deepEqual(await repository.setStatus('CLOSED'), { status: 'CLOSED', updatedAt: updatedAt.toISOString() });
    assert.deepEqual(await repository.setStatus('OPEN'), { status: 'OPEN', updatedAt: updatedAt.toISOString() });
    assert.deepEqual(update.mock.calls.map((call) => call.arguments[0].data.status), ['CLOSED', 'OPEN']);
  });

  it('reports missing store configuration', async () => {
    const prisma = { store: { findUnique: async () => null } } as unknown as PrismaClient;
    await assert.rejects(new PrismaStoreRepository(prisma).getStatus(),
      (error: unknown) => error instanceof ApplicationError && error.field === 'store' && error.code === 'NOT_FOUND');
  });
});
