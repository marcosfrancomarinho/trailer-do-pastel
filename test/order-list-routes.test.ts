import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { ListPendingOrders } from '../src/application/use-cases/orders/list-pending-orders.js';
import { ListPreparingOrders } from '../src/application/use-cases/orders/list-preparing-orders.js';
import { ListOrderHistory } from '../src/application/use-cases/orders/list-order-history.js';
import { ListPendingOrdersController } from '../src/infrastructure/http/controllers/orders/list-pending-orders-controller.js';
import { ListPreparingOrdersController } from '../src/infrastructure/http/controllers/orders/list-preparing-orders-controller.js';
import { ListOrderHistoryController } from '../src/infrastructure/http/controllers/orders/list-order-history-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

const scenarios = [
  { name: 'pending', method: 'findPending', UseCase: ListPendingOrders, Controller: ListPendingOrdersController },
  { name: 'preparing', method: 'findPreparing', UseCase: ListPreparingOrders, Controller: ListPreparingOrdersController },
  { name: 'history', method: 'findHistory', UseCase: ListOrderHistory, Controller: ListOrderHistoryController },
] as const;

for (const { name, method, UseCase, Controller } of scenarios) {
  describe(`${name} order route`, () => {
    it('forwards a selected local date and responds with the query result', async (context) => {
      let receivedRange: { start: Date; end: Date } | undefined;
      const queries = {
        [method]: async (range: { getValue(): { start: Date; end: Date } }) => {
          receivedRange = range.getValue();
          return [];
        },
      };
      const controller = new Controller(new UseCase(queries as never));
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ query: { date: '2026-10-24' } } as unknown as Request, response, next);

      assert.deepEqual(receivedRange, {
        start: new Date('2026-10-24T03:00:00.000Z'),
        end: new Date('2026-10-25T03:00:00.000Z'),
      });
      assert.deepEqual(status.mock.calls[0].arguments, [200]);
      assert.deepEqual(json.mock.calls[0].arguments, [[]]);
      assert.equal(next.mock.callCount(), 0);
    });

    it('passes an invalid date to the error handler without sending JSON', async (context) => {
      const query = context.mock.fn(async () => []);
      const controller = new Controller(new UseCase({ [method]: query } as never));
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ query: { date: '2026-02-30' } } as unknown as Request, response, next);

      assert.equal(query.mock.callCount(), 0);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
      assert.equal(next.mock.calls[0].arguments[0] instanceof DomainError, true);
    });
  });
}
