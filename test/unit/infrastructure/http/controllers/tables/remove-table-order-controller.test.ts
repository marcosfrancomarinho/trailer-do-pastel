import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { RemoveTableOrder } from '../../../../../../src/application/use-cases/tables/remove-table-order.js';
import { EventObserver } from '../../../../../../src/application/observer/event-observer.js';
import { RemoveTableOrderController } from '../../../../../../src/infrastructure/http/controllers/tables/remove-table-order-controller.js';
import { createOrderRepository } from '../../../../../helpers/order-fixtures.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('RemoveTableOrderController', () => {
  it('removes the order from the requested table and responds with the new total', async (context) => {
    const useCase = new RemoveTableOrder(
      createOrderRepository({ removeFromTable: async () => '12.5' }),
      new EventObserver(),
    );
    const remove = context.mock.method(useCase, 'remove');
    const controller = new RemoveTableOrderController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { tableId: 'table-1', orderId: 'order-1' } } as unknown as Request,
      response, next);

    assert.deepEqual(remove.mock.calls[0].arguments, [{ tableId: 'table-1', orderId: 'order-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ orderId: 'order-1', tableId: null, status: 'CANCELED', totalSpent: '12.5' }]);
    assert.equal(next.mock.callCount(), 0);
  });
});
