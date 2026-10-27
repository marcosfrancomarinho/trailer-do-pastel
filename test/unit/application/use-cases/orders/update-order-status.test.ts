import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UpdateOrderStatus } from '../../../../../src/application/use-cases/orders/update-order-status.js';
import { EventObserver } from '../../../../../src/application/observer/event-observer.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import { OrderStatus } from '../../../../../src/domain/value-objects/order/order-status.js';
import { createOrderRepository } from '../../../../helpers/order-fixtures.js';

describe('UpdateOrderStatus', () => {
  it('accepts every order status and normalizes the order ID', async (context) => {
    const updateStatus = context.mock.fn(async (_id: string, status: OrderStatus) => {
      assert.ok(status instanceof OrderStatus);
    });
    const events: { orderId: string; status: string }[] = [];
    const observer = new EventObserver();
    observer.register<{ orderId: string; status: string }>({
      async handle(event) {
        assert.equal(updateStatus.mock.callCount(), events.length + 1);
        await Promise.resolve();
        events.push(event);
      },
    });
    const useCase = new UpdateOrderStatus(
      createOrderRepository({ updateStatus }),
      observer,
    );
    const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELED'];

    for (const status of statuses) {
      assert.deepEqual(
        await useCase.update({ status, orderId: ' order-1 ' }),
        { status, id: 'order-1' },
      );
    }

    assert.deepEqual(updateStatus.mock.calls.map((call) => [call.arguments[0], call.arguments[1].getValue()]),
      statuses.map((status) => ['order-1', status]));
    assert.deepEqual(events, statuses.map(status => ({ orderId: 'order-1', status })));
  });

  it('rejects an invalid ID or status before calling the repository', async (context) => {
    const updateStatus = context.mock.fn(async () => {});
    const events: unknown[] = [];
    const observer = new EventObserver();
    observer.register({ handle(event) { events.push(event); } });
    const useCase = new UpdateOrderStatus(
      createOrderRepository({ updateStatus }),
      observer,
    );

    for (const [orderId, status, field] of [
      [' ', 'COMPLETED', 'orderId'],
      ['order-1', 'READY', 'status'],
      ['order-1', undefined, 'status'],
      ['order-1', null, 'status'],
      ['order-1', 3, 'status'],
      ['order-1', 'ready', 'status'],
    ] as const) {
      await assert.rejects(
        useCase.update({ orderId, status: status as never }),
        (error: unknown) => error instanceof DomainError && error.field === field,
      );
    }

    assert.equal(updateStatus.mock.callCount(), 0);
    assert.deepEqual(events, []);
  });

  it('does not notify listeners when the status update fails', async () => {
    const failure = new Error('Status update failed');
    const events: unknown[] = [];
    const observer = new EventObserver();
    observer.register({ handle(event) { events.push(event); } });
    const useCase = new UpdateOrderStatus(
      createOrderRepository({ updateStatus: async () => { throw failure; } }),
      observer,
    );

    await assert.rejects(useCase.update({ orderId: 'order-1', status: 'CANCELED' }),
      (error: unknown) => error === failure);
    assert.deepEqual(events, []);
  });
});
