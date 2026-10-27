import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RemoveTableOrder } from '../../../../../src/application/use-cases/tables/remove-table-order.js';
import { EventObserver } from '../../../../../src/application/observer/event-observer.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import { createOrderRepository } from '../../../../helpers/order-fixtures.js';

describe('RemoveTableOrder', () => {
  it('normalizes IDs and returns the updated table total', async (context) => {
    const calls: string[] = [];
    const repository = createOrderRepository({ removeFromTable: async () => {
      await Promise.resolve();
      calls.push('removed');
      return '12.5';
    } });
    const removeFromTable = context.mock.method(repository, 'removeFromTable');
    const observer = new EventObserver();
    observer.register<{ orderId: string; status: string; tableId: string }>({
      async handle(event) {
        assert.deepEqual(calls, ['removed']);
        assert.deepEqual(event, { orderId: 'order-1', status: 'CANCELED', tableId: 'table-1' });
        await Promise.resolve();
        calls.push('notified');
      },
    });
    const useCase = new RemoveTableOrder(repository, observer);

    assert.deepEqual(await useCase.remove({ tableId: ' table-1 ', orderId: ' order-1 ' }), {
      orderId: 'order-1', tableId: null, status: 'CANCELED', totalSpent: '12.5',
    });
    assert.deepEqual(removeFromTable.mock.calls[0].arguments, ['table-1', 'order-1']);
    assert.deepEqual(calls, ['removed', 'notified']);
  });

  it('rejects invalid IDs before writing', async (context) => {
    const repository = createOrderRepository();
    const removeFromTable = context.mock.method(repository, 'removeFromTable');
    const events: unknown[] = [];
    const observer = new EventObserver();
    observer.register({ handle(event) { events.push(event); } });
    const useCase = new RemoveTableOrder(repository, observer);

    for (const input of [{ tableId: ' ', orderId: 'order-1' }, { tableId: 'table-1', orderId: ' ' }]) {
      await assert.rejects(
        useCase.remove(input),
        (error: unknown) => error instanceof DomainError && error.field === (input.tableId.trim() ? 'orderId' : 'tableId'),
      );
    }
    assert.equal(removeFromTable.mock.callCount(), 0);
    assert.deepEqual(events, []);
  });

  it('does not notify when removing the order fails', async () => {
    const failure = new Error('Removal failed');
    const events: unknown[] = [];
    const observer = new EventObserver();
    observer.register({ handle(event) { events.push(event); } });
    const repository = createOrderRepository({ removeFromTable: async () => { throw failure; } });
    const useCase = new RemoveTableOrder(repository, observer);

    await assert.rejects(useCase.remove({ tableId: 'table-1', orderId: 'order-1' }),
      (error: unknown) => error === failure);
    assert.deepEqual(events, []);
  });
});
