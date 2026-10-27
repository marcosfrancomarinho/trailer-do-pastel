import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { PrismaAdditionRepository } from '../src/infrastructure/repositories/prisma-addition-repository.js';
import { buildCatalogAddition } from './helpers/order-fixtures.js';

describe('PrismaAdditionRepository', () => {
  it('loads an addition with its decimal price and returns null for an unknown ID', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { id: string } }) =>
      where.id === 'addition-1'
        ? { id: 'addition-1', name: 'Queijo extra', price: new Prisma.Decimal('2.50'), available: false }
        : null);
    const repository = new PrismaAdditionRepository({ addition: { findUnique } } as unknown as PrismaClient);

    const addition = await repository.findAdditionById('addition-1');
    assert.equal(addition?.getName(), 'Queijo extra');
    assert.equal(addition?.getPrice(), '2.5');
    assert.equal(addition?.isAvailable(), false);
    assert.equal(await repository.findAdditionById('missing'), null);
  });

  it('checks name uniqueness and saves a catalog addition', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { name: string } }) =>
      where.name === 'Queijo extra' ? { id: 'addition-1' } : null);
    const create = context.mock.fn(async () => ({ id: 'addition-2' }));
    const repository = new PrismaAdditionRepository({ addition: { findUnique, create } } as unknown as PrismaClient);

    assert.equal(await repository.existsByName('Queijo extra'), true);
    assert.equal(await repository.existsByName('Bacon'), false);
    assert.equal(await repository.save(buildCatalogAddition('addition-2', '3.50', false)), 'addition-2');
    assert.deepEqual(create.mock.calls[0].arguments, [{
      data: { name: 'Queijo extra', price: '3.5', available: false }, select: { id: true },
    }]);
  });

  it('translates a duplicate name error during creation', async () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('Duplicate', {
      code: 'P2002', clientVersion: '6.19.3',
    });
    const prisma = { addition: { create: async () => { throw duplicate; } } } as unknown as PrismaClient;

    await assert.rejects(new PrismaAdditionRepository(prisma).save(buildCatalogAddition('addition-1', '2.50')),
      (error: unknown) => error instanceof ApplicationError && error.code === 'ALREADY_EXISTS');
  });

  it('checks the exact product and addition association', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: {
      where: {
        productId_additionId: { productId: string; additionId: string };
      };
    }) => {
      const { productId } = where.productId_additionId;
      return productId === 'product-1' ? { productId } : null;
    });
    const prisma = { productAddition: { findUnique } } as unknown as PrismaClient;
    const repository = new PrismaAdditionRepository(prisma);

    assert.equal(await repository.isLinkedToProduct('product-1', 'addition-1'), true);
    assert.equal(await repository.isLinkedToProduct('product-2', 'addition-1'), false);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: {
        productId_additionId: { productId: 'product-1', additionId: 'addition-1' },
      },
      select: { productId: true },
    }]);
    assert.deepEqual(findUnique.mock.calls[1].arguments, [{
      where: {
        productId_additionId: { productId: 'product-2', additionId: 'addition-1' },
      },
      select: { productId: true },
    }]);
  });

  it('deletes an addition by ID', async (context) => {
    const remove = context.mock.fn(async () => ({ id: 'addition-1' }));
    const prisma = { addition: { delete: remove } } as unknown as PrismaClient;

    await new PrismaAdditionRepository(prisma).deleteById('addition-1');

    assert.deepEqual(remove.mock.calls[0].arguments, [{ where: { id: 'addition-1' } }]);
  });

  it('updates the addition fields', async (context) => {
    const update = context.mock.fn(async () => ({ id: 'addition-1' }));
    const prisma = { addition: { update } } as unknown as PrismaClient;

    await new PrismaAdditionRepository(prisma).update(buildCatalogAddition('addition-1', '3.50', false));

    assert.deepEqual(update.mock.calls[0].arguments, [{
      where: { id: 'addition-1' },
      data: { name: 'Queijo extra', price: '3.5', available: false },
    }]);
  });

  it('maps duplicate names and removed additions during update', async () => {
    const cases = [
      { prismaCode: 'P2002', applicationCode: 'ALREADY_EXISTS', field: 'name' },
      { prismaCode: 'P2025', applicationCode: 'NOT_FOUND', field: 'additionId' },
    ];

    for (const { prismaCode, applicationCode, field } of cases) {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Update failed', {
        code: prismaCode,
        clientVersion: '6.19.3',
      });
      const prisma = {
        addition: { update: async () => { throw prismaError; } },
      } as unknown as PrismaClient;

      await assert.rejects(
        new PrismaAdditionRepository(prisma).update(buildCatalogAddition('addition-1', '3.50')),
        (error: unknown) => error instanceof ApplicationError
          && error.field === field
          && error.code === applicationCode,
      );
    }
  });

  it('reports missing additions and additions used in orders', async () => {
    const cases = [
      { prismaCode: 'P2025', applicationCode: 'NOT_FOUND' },
      { prismaCode: 'P2003', applicationCode: 'IN_USE' },
    ];

    for (const { prismaCode, applicationCode } of cases) {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Deletion failed', {
        code: prismaCode,
        clientVersion: '6.19.3',
      });
      const prisma = {
        addition: { delete: async () => { throw prismaError; } },
      } as unknown as PrismaClient;

      await assert.rejects(
        new PrismaAdditionRepository(prisma).deleteById('addition-1'),
        (error: unknown) => error instanceof ApplicationError
          && error.field === 'additionId'
          && error.code === applicationCode,
      );
    }
  });
});
