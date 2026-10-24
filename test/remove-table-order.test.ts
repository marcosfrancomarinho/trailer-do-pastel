import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RemoveTableOrder } from '../src/application/use-cases/tables/remove-table-order.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createOrderRepository } from './helpers/order-fixtures.js';

describe('RemoveTableOrder', () => {
  it('normalizes IDs and returns the updated table total', async (context) => {
    const repository = createOrderRepository({ removeFromTable: async () => '12.5' });
    const removeFromTable = context.mock.method(repository, 'removeFromTable');
    const useCase = new RemoveTableOrder(repository);

    assert.deepEqual(await useCase.remove({ tableId: ' table-1 ', orderId: ' order-1 ' }), {
      orderId: 'order-1', tableId: null, status: 'CANCELED', totalSpent: '12.5',
    });
    assert.deepEqual(removeFromTable.mock.calls[0].arguments, ['table-1', 'order-1']);
  });

  it('rejects invalid IDs before writing', async (context) => {
    const repository = createOrderRepository();
    const removeFromTable = context.mock.method(repository, 'removeFromTable');
    const useCase = new RemoveTableOrder(repository);

    for (const input of [{ tableId: ' ', orderId: 'order-1' }, { tableId: 'table-1', orderId: ' ' }]) {
      await assert.rejects(
        useCase.remove(input),
        (error: unknown) => error instanceof DomainError && error.field === (input.tableId.trim() ? 'orderId' : 'tableId'),
      );
    }
    assert.equal(removeFromTable.mock.callCount(), 0);
  });
});
