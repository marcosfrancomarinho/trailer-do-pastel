import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { UpdateAddition } from '../src/application/use-cases/additions/update-addition.js';
import { UpdateAdditionController } from '../src/infrastructure/http/controllers/additions/update-addition-controller.js';
import { createAdditionRepository } from './helpers/order-fixtures.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('UpdateAdditionController', () => {
  it('takes the ID from the route and responds with the updated ID', async (context) => {
    const useCase = new UpdateAddition(createAdditionRepository());
    const update = context.mock.method(useCase, 'update', async () => ({ id: 'addition-1' }));
    const controller = new UpdateAdditionController(useCase);
    const request = {
      params: { additionId: 'addition-1' },
      body: { price: '3.50', available: false, id: 'ignored' },
    } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(update.mock.calls[0].arguments, [{
      additionId: 'addition-1',
      name: undefined,
      price: '3.50',
      available: false,
    }]);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'addition-1' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards errors without writing a response', async (context) => {
    const failure = new Error('Database unavailable');
    const useCase = new UpdateAddition(createAdditionRepository({ update: async () => { throw failure; } }));
    const controller = new UpdateAdditionController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({
      params: { additionId: 'addition-1' },
      body: { price: '3.50' },
    } as unknown as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
