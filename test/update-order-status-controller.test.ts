import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { UpdateOrderStatus } from '../src/application/use-cases/orders/update-order-status.js';
import { UpdateOrderStatusController } from '../src/infrastructure/http/controllers/orders/update-order-status-controller.js';
import { createOrderRepository } from './helpers/order-fixtures.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('UpdateOrderStatusController', () => {
  it('reads the order ID from the route and responds with the new status', async (context) => {
    const useCase = new UpdateOrderStatus(createOrderRepository());
    const update = context.mock.method(useCase, 'update', async () => ({ id: 'order-1', status: 'COMPLETED' as const }));
    const controller = new UpdateOrderStatusController(useCase);
    const request = {
      params: { orderId: 'order-1' },
      body: { status: 'COMPLETED', id: 'ignored' },
    } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(update.mock.calls[0].arguments, [{ status: 'COMPLETED', orderId: 'order-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'order-1', status: 'COMPLETED' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards errors without writing a response', async (context) => {
    const failure = new Error('Database unavailable');
    const useCase = new UpdateOrderStatus(createOrderRepository({ updateStatus: async () => { throw failure; } }));
    const controller = new UpdateOrderStatusController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({
      params: { orderId: 'order-1' },
      body: { status: 'COMPLETED' },
    } as unknown as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
