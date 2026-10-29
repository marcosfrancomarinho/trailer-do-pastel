import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../../../src/application/errors/application-error.js';
import { PrismaAdditionRepository } from '../../../../src/infrastructure/repositories/prisma-addition-repository.js';
import { buildCatalogAddition } from '../../../helpers/order-fixtures.js';

describe('PrismaAdditionRepository', () => {
  it('loads an addition with its decimal price and returns null for an unknown ID', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { id: string } }) =>
      where.id === 'addition-1'
        ? { id: 'addition-1', name: 'Queijo extra', price: new Prisma.Decimal('2.50'), available: false }
        : null);
    const repository = new PrismaAdditionRepository({ addition: { findFirst: findUnique } } as unknown as PrismaClient);

    const addition = await repository.findAdditionById('addition-1');
    assert.equal(addition?.getName(), 'Queijo extra');
    assert.equal(addition?.getPrice(), '2.5');
    assert.equal(addition?.isAvailable(), false);
    assert.equal(await repository.findAdditionById('missing'), null);
  });

  it('creates a new catalog addition', async () => {
    const addition = {
      findUnique: async () => null,
      create: async () => ({ id: 'addition-2' }),
    };
    const repository = new PrismaAdditionRepository({ addition } as unknown as PrismaClient);
    assert.equal(await repository.save(buildCatalogAddition('addition-2', '3.50', false)), 'addition-2');
  });

  it('reactivates an archived addition, updating its price and availability', async () => {
    const addition = {
      findUnique: async () => ({ id: 'old-id', deletedAt: new Date() }),
      updateMany: async (args: { data: { deletedAt: Date | null; price: string; available: boolean } }) => {
        assert.equal(args.data.deletedAt, null);
        assert.equal(args.data.price, '3.5');
        assert.equal(args.data.available, false);
        return { count: 1 };
      },
    };
    const repository = new PrismaAdditionRepository({ addition } as unknown as PrismaClient);
    assert.equal(await repository.save(buildCatalogAddition('new-id', '3.50', false)), 'old-id');
  });

  it('rejects additions which are already active', async () => {
    const addition = { findUnique: async () => ({ id: 'active-id', deletedAt: null }) };
    const repository = new PrismaAdditionRepository({ addition } as unknown as PrismaClient);
    await assert.rejects(repository.save(buildCatalogAddition('new-id', '3.50')),
      (error: unknown) => error instanceof ApplicationError && error.code === 'ALREADY_EXISTS');
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

  it('reports missing additions', async () => {
    const cases = [
      { prismaCode: 'P2025', applicationCode: 'NOT_FOUND' },
    ];

    for (const { prismaCode, applicationCode } of cases) {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Deletion failed', {
        code: prismaCode,
        clientVersion: '6.19.3',
      });
      const prisma = {
        addition: { update: async () => { throw prismaError; } },
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
