import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaStoreRepository } from '../../../../src/infrastructure/repositories/prisma-store-repository.js';

describe('PrismaStoreRepository', () => {
  const updatedAt = new Date('2026-10-23T12:00:00.000Z');

  it('lê o status existente sem sobrescrever a configuração da loja', async (context) => {
    const upsert = context.mock.fn(async () => ({ status: 'CLOSED' as const, updatedAt }));
    const prisma = { store: { upsert } } as unknown as PrismaClient;
    const repository = new PrismaStoreRepository(prisma);

    const state = await repository.getStatus();
    assert.equal(state.getStatus(), 'CLOSED');
    assert.deepEqual(state.getUpdatedAt(), updatedAt);
    assert.deepEqual(upsert.mock.calls[0].arguments, [{
      where: { id: 1 },
      create: { id: 1, status: 'OPEN' },
      update: {},
      select: { status: true, updatedAt: true },
    }]);
  });

  it('inicializa a loja aberta se o registro ainda não existe', async (context) => {
    const upsert = context.mock.fn(async () => ({ status: 'OPEN' as const, updatedAt }));
    const prisma = { store: { upsert } } as unknown as PrismaClient;
    const repository = new PrismaStoreRepository(prisma);

    const state = await repository.getStatus();
    assert.equal(state.getStatus(), 'OPEN');
    assert.deepEqual(state.getUpdatedAt(), updatedAt);
    assert.deepEqual(upsert.mock.calls[0].arguments, [{
      where: { id: 1 },
      create: { id: 1, status: 'OPEN' },
      update: {},
      select: { status: true, updatedAt: true },
    }]);
  });

  it('lê a loja criada por outra requisição durante a inicialização', async (context) => {
    const conflict = new Prisma.PrismaClientKnownRequestError('Store already exists', {
      code: 'P2002', clientVersion: '6',
    });
    const findUnique = context.mock.fn(async () => ({ status: 'CLOSED' as const, updatedAt }));
    const prisma = {
      store: {
        upsert: async () => { throw conflict; },
        findUnique,
      },
    } as unknown as PrismaClient;

    const state = await new PrismaStoreRepository(prisma).getStatus();

    assert.equal(state.getStatus(), 'CLOSED');
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { id: 1 }, select: { status: true, updatedAt: true },
    }]);
  });

  it('permite abrir e fechar a loja mesmo quando ainda não há registro', async (context) => {
    const upsert = context.mock.fn(async ({ create }: { create: { status: 'OPEN' | 'CLOSED' } }) =>
      ({ status: create.status, updatedAt }));
    const prisma = { store: { upsert } } as unknown as PrismaClient;
    const repository = new PrismaStoreRepository(prisma);

    const closedState = await repository.setStatus('CLOSED');
    const openState = await repository.setStatus('OPEN');
    assert.equal(closedState.getStatus(), 'CLOSED');
    assert.equal(openState.getStatus(), 'OPEN');
    assert.deepEqual(closedState.getUpdatedAt(), updatedAt);
    assert.deepEqual(openState.getUpdatedAt(), updatedAt);
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
