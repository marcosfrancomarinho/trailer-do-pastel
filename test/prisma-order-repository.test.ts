import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { OrderStatus } from '../src/domain/value-objects/order/order-status.js';
import { PrismaOrderRepository } from '../src/infrastructure/repositories/prisma-order-repository.js';
import { OrderObservation } from '../src/domain/value-objects/order/order-observation.js';
import { Order } from '../src/domain/entities/order.js';
import { CustomerName } from '../src/domain/value-objects/customer/customer-name.js';
import { CustomerPhone } from '../src/domain/value-objects/customer/customer-phone.js';
import { buildOrderItem } from './helpers/order-fixtures.js';
import { ReferenceId } from '../src/domain/value-objects/shared/reference-id.js';

function sampleOrder(tableId: string | null = null): Order {
  return Order.create(
    CustomerName.create('Maria'), CustomerPhone.create('11999999999'),
    [buildOrderItem()], OrderObservation.create('Sem cebola'),
    tableId === null ? null : ReferenceId.create(tableId, 'tableId'),
  );
}

describe('PrismaOrderRepository', () => {
  it('cancels a removed order, keeps its comanda history, and subtracts its cost atomically', async (context) => {
    const calls: string[] = [];
    const lock = context.mock.fn(async (_parts: TemplateStringsArray, id: string) => {
      calls.push('lock');
      assert.equal(id, 'table-1');
      return [{ status: 'OCCUPIED' }];
    });
    const changeOrder = context.mock.fn(async () => { calls.push('cancel'); return { count: 1 }; });
    const createHistory = context.mock.fn(async () => { calls.push('history'); return {}; });
    const decrement = context.mock.fn(async () => { calls.push('decrement'); return { count: 1 }; });
    const tx = {
      $queryRaw: lock,
      order: { findUnique: async () => ({ tableId: 'table-1', total: new Prisma.Decimal('12.5'), status: 'PREPARING' }), updateMany: changeOrder },
      orderStatusHistory: { create: createHistory },
      table: { updateMany: decrement, findUniqueOrThrow: async () => ({ totalSpent: new Prisma.Decimal('13') }) },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;

    assert.equal(await new PrismaOrderRepository(prisma).removeFromTable('table-1', 'order-1'), '13');
    assert.deepEqual(calls, ['lock', 'cancel', 'history', 'decrement']);
    assert.deepEqual(changeOrder.mock.calls[0].arguments, [{
      where: { id: 'order-1', tableId: 'table-1', status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
      data: { tableId: null, status: 'CANCELED' },
    }]);
    assert.deepEqual(createHistory.mock.calls[0].arguments, [{ data: { orderId: 'order-1', status: 'CANCELED' } }]);
    assert.deepEqual(decrement.mock.calls[0].arguments, [{
      where: { id: 'table-1', totalSpent: { gte: new Prisma.Decimal('12.5') } },
      data: { totalSpent: { decrement: new Prisma.Decimal('12.5') } },
    }]);
  });

  it('rejects an order from another table or already completed', async (context) => {
    const updateMany = context.mock.fn(async () => ({ count: 1 }));
    for (const order of [
      { tableId: 'table-2', status: 'PREPARING' },
      { tableId: 'table-1', status: 'COMPLETED' },
    ]) {
      const tx = {
        $queryRaw: async () => [{ status: 'OCCUPIED' }],
        order: { findUnique: async () => ({ ...order, total: new Prisma.Decimal('12.5') }), updateMany },
      };
      const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
      await assert.rejects(
        new PrismaOrderRepository(prisma).removeFromTable('table-1', 'order-1'),
        (error: unknown) => error instanceof ApplicationError &&
          error.code === (order.tableId === 'table-1' ? 'UNAVAILABLE' : 'NOT_FOUND'),
      );
    }
    assert.equal(updateMany.mock.callCount(), 0);
  });

  it('rejects a concurrent removal without subtracting twice', async (context) => {
    let lookups = 0;
    const decrement = context.mock.fn(async () => ({ count: 1 }));
    const tx = {
      $queryRaw: async () => [{ status: 'OCCUPIED' }],
      order: {
        findUnique: async () => ++lookups === 1
          ? { tableId: 'table-1', status: 'PENDING', total: new Prisma.Decimal('10') }
          : { tableId: null },
        updateMany: async () => ({ count: 0 }),
      },
      table: { updateMany: decrement },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    await assert.rejects(new PrismaOrderRepository(prisma).removeFromTable('table-1', 'order-1'),
      (error: unknown) => error instanceof ApplicationError && error.code === 'NOT_FOUND');
    assert.equal(decrement.mock.callCount(), 0);
  });

  it('rejects a deduction that would make the table total negative', async () => {
    const tx = {
      $queryRaw: async () => [{ status: 'OCCUPIED' }],
      order: {
        findUnique: async () => ({ tableId: 'table-1', total: new Prisma.Decimal('12.5'), status: 'CONFIRMED' }),
        updateMany: async () => ({ count: 1 }),
      },
      orderStatusHistory: { create: async () => ({}) },
      table: { updateMany: async () => ({ count: 0 }) },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    await assert.rejects(new PrismaOrderRepository(prisma).removeFromTable('table-1', 'order-1'),
      (error: unknown) => error instanceof ApplicationError && error.code === 'IN_USE');
  });

  it('persists an app order without a comanda', async (context) => {
    const create = context.mock.fn(async () => ({ id: 'order-1', trackingToken: 'token-1' }));
    const lockStore = context.mock.fn(async (parts: TemplateStringsArray) => {
      assert.match(parts.join(''), /FOR SHARE/);
      return [{ status: 'OPEN' }];
    });
    const tx = { $queryRaw: lockStore, order: { create } };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    await new PrismaOrderRepository(prisma).save(sampleOrder());
    assert.equal(lockStore.mock.callCount(), 1);
    assert.equal(create.mock.calls[0].arguments[0].data.observation, 'Sem cebola');
    assert.equal(create.mock.calls[0].arguments[0].data.tableId, null);
    assert.equal(create.mock.calls[0].arguments[0].data.tableSessionId, null);
  });

  it('adds consecutive table orders to the same open comanda', async (context) => {
    const updateTable = context.mock.fn(async () => ({ count: 1 }));
    const findSession = context.mock.fn(async () => ({ id: 'session-1' }));
    const createOrder = context.mock.fn(async () => ({ id: 'order-1', trackingToken: 'token-1' }));
    const tx = {
      $queryRaw: async () => [{ status: 'OPEN' }],
      table: { updateMany: updateTable }, tableSession: { findFirst: findSession }, order: { create: createOrder },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    const repository = new PrismaOrderRepository(prisma);

    await repository.save(sampleOrder('table-1'));
    await repository.save(sampleOrder('table-1'));
    assert.equal(findSession.mock.callCount(), 2);
    assert.equal(createOrder.mock.calls[0].arguments[0].data.tableSessionId, 'session-1');
    assert.equal(createOrder.mock.calls[1].arguments[0].data.tableSessionId, 'session-1');
    assert.deepEqual(updateTable.mock.calls[0].arguments[0].data,
      { status: 'OCCUPIED', totalSpent: { increment: '10' } });
    assert.deepEqual(updateTable.mock.calls[0].arguments[0].where,
      { id: 'table-1', deletedAt: null });
  });

  it('opens a new comanda for a free table and rejects an unknown table', async (context) => {
    const createSession = context.mock.fn(async () => ({ id: 'session-new' }));
    const createOrder = context.mock.fn(async () => ({ id: 'order-1', trackingToken: 'token-1' }));
    const tx = {
      $queryRaw: async () => [{ status: 'OPEN' }],
      table: { updateMany: async () => ({ count: 1 }) },
      tableSession: { findFirst: async () => null, create: createSession },
      order: { create: createOrder },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    await new PrismaOrderRepository(prisma).save(sampleOrder('table-1'));
    assert.deepEqual(createSession.mock.calls[0].arguments, [{ data: { tableId: 'table-1' }, select: { id: true } }]);
    assert.equal(createOrder.mock.calls[0].arguments[0].data.tableSessionId, 'session-new');

    const invalidTx = {
      $queryRaw: async () => [{ status: 'OPEN' }],
      table: { updateMany: async () => ({ count: 0 }) }, order: { create: createOrder },
    };
    const invalidPrisma = { $transaction: async (work: (client: typeof invalidTx) => Promise<unknown>) => work(invalidTx) } as unknown as PrismaClient;
    await assert.rejects(new PrismaOrderRepository(invalidPrisma).save(sampleOrder('archived-or-missing')),
      (error: unknown) => error instanceof ApplicationError && error.field === 'tableId' && error.code === 'NOT_FOUND');
    assert.equal(createOrder.mock.callCount(), 1);
  });

  it('refuses app and table orders while the store is closed', async (context) => {
    const createOrder = context.mock.fn(async () => ({ id: 'unexpected' }));
    const updateTable = context.mock.fn(async () => ({ count: 1 }));
    const tx = {
      $queryRaw: async () => [{ status: 'CLOSED' }],
      order: { create: createOrder }, table: { updateMany: updateTable },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    const repository = new PrismaOrderRepository(prisma);
    for (const order of [sampleOrder(), sampleOrder('table-1')]) {
      await assert.rejects(repository.save(order),
        (error: unknown) => error instanceof ApplicationError && error.field === 'store' && error.code === 'UNAVAILABLE');
    }
    assert.equal(createOrder.mock.callCount(), 0);
    assert.equal(updateTable.mock.callCount(), 0);
  });

  it('cancels a linked order and adjusts the table total in one transaction', async (context) => {
    const updateOrder = context.mock.fn(async () => ({ count: 1 }));
    const createHistory = context.mock.fn(async () => ({}));
    const decrement = context.mock.fn(async () => ({ count: 1 }));
    const lock = context.mock.fn(async () => [{ id: 'table-1' }]);
    const tx = {
      order: { findUnique: async () => ({ tableId: 'table-1', status: 'PREPARING', total: new Prisma.Decimal('12.5') }), updateMany: updateOrder },
      $queryRaw: lock,
      orderStatusHistory: { create: createHistory },
      table: { updateMany: decrement },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    await new PrismaOrderRepository(prisma).updateStatus('order-1', OrderStatus.create('CANCELED'));
    assert.equal(lock.mock.callCount(), 1);
    assert.deepEqual(updateOrder.mock.calls[0].arguments, [{
      where: { id: 'order-1', status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
      data: { status: 'CANCELED' },
    }]);
    assert.deepEqual(createHistory.mock.calls[0].arguments, [{ data: { orderId: 'order-1', status: 'CANCELED' } }]);
    assert.deepEqual(decrement.mock.calls[0].arguments[0].data,
      { totalSpent: { decrement: new Prisma.Decimal('12.5') } });
  });

  it('keeps the table total for a completed order and prevents reopening terminal orders', async (context) => {
    const decrement = context.mock.fn(async () => ({ count: 1 }));
    const updateOrder = context.mock.fn(async () => ({ count: 1 }));
    let currentStatus = 'PREPARING';
    const tx = {
      order: {
        findUnique: async () => ({ tableId: 'table-1', status: currentStatus, total: new Prisma.Decimal('10') }),
        updateMany: updateOrder,
      },
      $queryRaw: async () => [{ id: 'table-1' }],
      orderStatusHistory: { create: async () => ({}) },
      table: { updateMany: decrement },
    };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    const repository = new PrismaOrderRepository(prisma);
    await repository.updateStatus('order-1', OrderStatus.create('COMPLETED'));
    assert.equal(decrement.mock.callCount(), 0);
    currentStatus = 'COMPLETED';
    await assert.rejects(repository.updateStatus('order-1', OrderStatus.create('PREPARING')),
      (error: unknown) => error instanceof ApplicationError && error.code === 'UNAVAILABLE');
    assert.equal(updateOrder.mock.callCount(), 1);
  });

  it('reports a missing order', async () => {
    const tx = { order: { findUnique: async () => null } };
    const prisma = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as PrismaClient;
    await assert.rejects(new PrismaOrderRepository(prisma).updateStatus('missing', OrderStatus.create('COMPLETED')),
      (error: unknown) => error instanceof ApplicationError && error.field === 'orderId' && error.code === 'NOT_FOUND');
  });
});
