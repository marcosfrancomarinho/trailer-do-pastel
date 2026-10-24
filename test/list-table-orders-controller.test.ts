import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListTableOrders } from '../src/application/use-cases/tables/list-table-orders.js';
import { ListTableOrdersController } from '../src/infrastructure/http/controllers/tables/list-table-orders-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('ListTableOrdersController', () => {
  it('reads the table ID from the route and responds with its orders', async (context) => {
    const result = { tableId: 'table-1', number: 1, status: 'FREE' as const, totalSpent: '0', sessionId: null, orders: [] };
    const useCase = new ListTableOrders({ findByTableId: async () => result });
    const list = context.mock.method(useCase, 'list');
    const controller = new ListTableOrdersController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { tableId: 'table-1' } } as unknown as Request, response, next);

    assert.deepEqual(list.mock.calls[0].arguments, [{ tableId: 'table-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [result]);
    assert.equal(next.mock.callCount(), 0);
  });
});
