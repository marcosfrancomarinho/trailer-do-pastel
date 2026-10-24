import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { PrismaStoreRepository } from '../src/infrastructure/repositories/prisma-store-repository.js';

describe('PrismaStoreRepository', () => {
  const updatedAt = new Date('2026-10-23T12:00:00.000Z');

  it('lê o status existente sem sobrescrever a configuração da loja', async (context) => {
    const findUnique = context.mock.fn(async () => ({ status: 'CLOSED' as const, updatedAt }));
    const upsert = context.mock.fn(async () => { throw new Error('Não deveria inicializar novamente.'); });
    const prisma = { store: { findUnique, upsert } } as unknown as PrismaClient;
    const repository = new PrismaStoreRepository(prisma);

    assert.deepEqual(await repository.getStatus(), { status: 'CLOSED', updatedAt: updatedAt.toISOString() });
    assert.equal(upsert.mock.callCount(), 0);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { id: 1 }, select: { status: true, updatedAt: true },
    }]);
  });

  it('inicializa a loja aberta se o registro ainda não existe', async (context) => {
    const upsert = context.mock.fn(async () => ({ status: 'OPEN' as const, updatedAt }));
    const prisma = { store: { findUnique: async () => null, upsert } } as unknown as PrismaClient;
    const repository = new PrismaStoreRepository(prisma);

    assert.deepEqual(await repository.getStatus(), { status: 'OPEN', updatedAt: updatedAt.toISOString() });
    assert.deepEqual(upsert.mock.calls[0].arguments, [{
      where: { id: 1 },
      create: { id: 1, status: 'OPEN' },
      update: {},
      select: { status: true, updatedAt: true },
    }]);
  });

  it('permite abrir e fechar a loja mesmo quando ainda não há registro', async (context) => {
    const upsert = context.mock.fn(async ({ create }: { create: { status: 'OPEN' | 'CLOSED' } }) =>
      ({ status: create.status, updatedAt }));
    const prisma = { store: { upsert } } as unknown as PrismaClient;
    const repository = new PrismaStoreRepository(prisma);

    assert.deepEqual(await repository.setStatus('CLOSED'), { status: 'CLOSED', updatedAt: updatedAt.toISOString() });
    assert.deepEqual(await repository.setStatus('OPEN'), { status: 'OPEN', updatedAt: updatedAt.toISOString() });
    assert.deepEqual(upsert.mock.calls.map(call => call.arguments[0]), [
      {
        where: { id: 1 },
        create: { id: 1, status: 'CLOSED' },
        update: { status: 'CLOSED' },
        select: { status: true, updatedAt: true },
      },
      {
        where: { id: 1 },
        create: { id: 1, status: 'OPEN' },
        update: { status: 'OPEN' },
        select: { status: true, updatedAt: true },
      },
    ]);
  });
});
