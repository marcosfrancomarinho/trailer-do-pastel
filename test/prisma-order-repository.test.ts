import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { OrderStatus } from '../src/domain/value-objects/order/order-status.js';
import { PrismaOrderRepository } from '../src/infrastructure/repositories/prisma-order-repository.js';

describe('PrismaOrderRepository', () => {
  it('updates the status and creates its history in the same write', async (context) => {
    const update = context.mock.fn(async () => ({ id: 'order-1' }));
    const prisma = { order: { update } } as unknown as PrismaClient;

    await new PrismaOrderRepository(prisma).updateStatus('order-1', OrderStatus.create('READY'));

    assert.deepEqual(update.mock.calls[0].arguments, [{
      where: { id: 'order-1' },
      data: {
        status: 'READY',
        histories: { create: { status: 'READY' } },
      },
    }]);
  });

  it('reports a missing order', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Update failed', {
      code: 'P2025',
      clientVersion: '6.19.3',
    });
    const prisma = {
      order: { update: async () => { throw prismaError; } },
    } as unknown as PrismaClient;

    await assert.rejects(
      new PrismaOrderRepository(prisma).updateStatus('missing', OrderStatus.create('READY')),
      (error: unknown) => error instanceof ApplicationError
        && error.field === 'orderId'
        && error.code === 'NOT_FOUND',
    );
  });
});
