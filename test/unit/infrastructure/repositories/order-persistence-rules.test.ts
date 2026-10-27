import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, type PrismaClient } from '@prisma/client';
import { PrismaOrderRepository } from '../../../../src/infrastructure/repositories/prisma-order-repository.js';
import { ApplicationError } from '../../../../src/application/errors/application-error.js';
import { OrderStatus } from '../../../../src/domain/value-objects/order/order-status.js';
import { buildOrder, buildOrderAddition, buildOrderItem } from '../../../helpers/order-fixtures.js';

function repository(tx: object): PrismaOrderRepository {
  return new PrismaOrderRepository({
    $transaction: async (work: (client: object) => Promise<unknown>) => work(tx),
  } as unknown as PrismaClient);
}

const rejectsRule = (field: string, code: string) => (error: unknown): boolean =>
  error instanceof ApplicationError && error.field === field && error.code === code;

describe('Order persistence business rules', () => {
  it('rejects removal from an unknown table without looking up or changing an order', async (context) => {
    const findUnique = context.mock.fn(async () => null);
    await assert.rejects(repository({ $queryRaw: async () => [], order: { findUnique } })
      .removeFromTable('missing', 'order-1'), rejectsRule('tableId', 'NOT_FOUND'));
    assert.equal(findUnique.mock.callCount(), 0);
  });

  for (const order of [null, { tableId: 'table-1', status: 'CANCELED' }]) {
    it(`rejects removal of ${order === null ? 'a missing' : 'a canceled'} order without writes`, async (context) => {
      const updateMany = context.mock.fn(async () => ({ count: 1 }));
      await assert.rejects(repository({ $queryRaw: async () => [{ id: 'table-1' }],
        order: { findUnique: async () => order, updateMany } }).removeFromTable('table-1', 'order-1'),
      rejectsRule(order === null ? 'orderId' : 'status', order === null ? 'NOT_FOUND' : 'UNAVAILABLE'));
      assert.equal(updateMany.mock.callCount(), 0);
    });
  }

  for (const current of [null, { tableId: 'table-2' }, { tableId: 'table-1' }]) {
    it(`rejects a removal race when the current order is ${JSON.stringify(current)}`, async (context) => {
      let reads = 0;
      const create = context.mock.fn(async () => ({}));
      const decrement = context.mock.fn(async () => ({ count: 1 }));
      const tx = {
        $queryRaw: async () => [{ id: 'table-1' }],
        order: { findUnique: async () => ++reads === 1
          ? { tableId: 'table-1', status: 'PENDING', total: new Prisma.Decimal('10') } : current,
        updateMany: async () => ({ count: 0 }) },
        orderStatusHistory: { create }, table: { updateMany: decrement },
      };
      const sameTable = current?.tableId === 'table-1';
      await assert.rejects(repository(tx).removeFromTable('table-1', 'order-1'),
        rejectsRule(sameTable ? 'status' : 'orderId', sameTable ? 'UNAVAILABLE' : 'NOT_FOUND'));
      assert.equal(create.mock.callCount(), 0);
      assert.equal(decrement.mock.callCount(), 0);
    });
  }

  it('refuses orders before the store record exists without creating an order', async (context) => {
    const create = context.mock.fn(async () => ({ id: 'unexpected', trackingToken: 'unexpected' }));
    await assert.rejects(repository({ $queryRaw: async () => [], order: { create } }).save(buildOrder()),
      rejectsRule('store', 'UNAVAILABLE'));
    assert.equal(create.mock.callCount(), 0);
  });

  it('stores catalog snapshots and additions with the original decimal precision', async (context) => {
    const create = context.mock.fn(async (_input: unknown) => ({ id: 'order-1', trackingToken: 'token-1' }));
    const result = await repository({ $queryRaw: async () => [{ status: 'OPEN' }], order: { create } })
      .save(buildOrder([buildOrderItem(3, '0.1', [buildOrderAddition(2, '0.2')])]));
    assert.deepEqual(result, { id: 'order-1', trackingToken: 'token-1' });
    assert.deepEqual(create.mock.calls[0].arguments, [{
      data: { tableId: null, tableSessionId: null, userId: null, customerName: 'Marcos',
        customerPhone: '11999999999', observation: null, status: 'PENDING', total: '1.5',
        items: { create: [{ productId: 'product-1', productName: 'Pastel de queijo', quantity: 3,
          unitPrice: '0.1', additions: { create: [{ additionId: 'addition-1', quantity: 2, unitPrice: '0.2' }] } }] },
        histories: { create: { status: 'PENDING' } } },
      select: { id: true, trackingToken: true },
    }]);
  });

  for (const code of ['P2003', 'P2025', 'P2002']) {
    it(`handles persistence failure ${code} without exposing missing catalog records`, async () => {
      const failure = new Prisma.PrismaClientKnownRequestError('Database failure', { code, clientVersion: '6' });
      await assert.rejects(repository({ $queryRaw: async () => [{ status: 'OPEN' }],
        order: { create: async () => { throw failure; } } }).save(buildOrder()),
      code === 'P2002' ? (error: unknown) => error === failure : rejectsRule('order', 'NOT_FOUND'));
    });
  }

  it('reports an order deleted between the initial lookup and status update without writing history', async (context) => {
    let reads = 0;
    const updateMany = context.mock.fn(async () => ({ count: 1 }));
    await assert.rejects(repository({ order: {
      findUnique: async () => ++reads === 1 ? { tableId: null } : null, updateMany,
    } }).updateStatus('order-1', OrderStatus.create('CONFIRMED')), rejectsRule('orderId', 'NOT_FOUND'));
    assert.equal(updateMany.mock.callCount(), 0);
  });

  it('does not write history or adjust totals after losing a concurrent status update', async (context) => {
    const create = context.mock.fn(async () => ({}));
    const decrement = context.mock.fn(async () => ({ count: 1 }));
    await assert.rejects(repository({
      $queryRaw: async () => [{ id: 'table-1' }],
      order: { findUnique: async () => ({ tableId: 'table-1', status: 'PENDING', total: new Prisma.Decimal('10') }),
        updateMany: async () => ({ count: 0 }) },
      orderStatusHistory: { create }, table: { updateMany: decrement },
    }).updateStatus('order-1', OrderStatus.create('CANCELED')), rejectsRule('status', 'UNAVAILABLE'));
    assert.equal(create.mock.callCount(), 0);
    assert.equal(decrement.mock.callCount(), 0);
  });

  it('rejects cancellation when the table cannot cover the order total', async () => {
    await assert.rejects(repository({
      $queryRaw: async () => [{ id: 'table-1' }],
      order: { findUnique: async () => ({ tableId: 'table-1', status: 'PREPARING', total: new Prisma.Decimal('10') }),
        updateMany: async () => ({ count: 1 }) },
      orderStatusHistory: { create: async () => ({}) }, table: { updateMany: async () => ({ count: 0 }) },
    }).updateStatus('order-1', OrderStatus.create('CANCELED')), rejectsRule('tableId', 'IN_USE'));
  });

  for (const status of ['COMPLETED', 'CANCELED'] as const) {
    for (const target of ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELED']) {
      it(`prevents changing terminal status ${status} to ${target}`, async (context) => {
        const updateMany = context.mock.fn(async () => ({ count: 1 }));
        await assert.rejects(repository({ order: {
          findUnique: async () => ({ tableId: null, status }), updateMany,
        } }).updateStatus('order-1', OrderStatus.create(target)), rejectsRule('status', 'UNAVAILABLE'));
        assert.equal(updateMany.mock.callCount(), 0);
      });
    }
  }

  for (const target of ['CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELED']) {
    it(`updates an online order to ${target} without touching a table`, async (context) => {
      const lock = context.mock.fn(async () => []);
      const decrement = context.mock.fn(async () => ({ count: 1 }));
      const create = context.mock.fn(async (_input: unknown) => ({}));
      await repository({ $queryRaw: lock,
        order: { findUnique: async () => ({ tableId: null, status: 'PENDING', total: new Prisma.Decimal('10') }),
          updateMany: async () => ({ count: 1 }) },
        orderStatusHistory: { create }, table: { updateMany: decrement },
      }).updateStatus('order-1', OrderStatus.create(target));
      assert.equal(lock.mock.callCount(), 0);
      assert.equal(decrement.mock.callCount(), 0);
      assert.deepEqual(create.mock.calls[0].arguments, [{ data: { orderId: 'order-1', status: target } }]);
    });
  }
});
