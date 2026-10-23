import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { DeleteAddition } from '../src/application/use-cases/additions/delete-addition.js';
import { DeleteAdditionController } from '../src/infrastructure/http/controllers/additions/delete-addition-controller.js';
import { createAdditionRepository } from './helpers/order-fixtures.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('DeleteAdditionController', () => {
  it('takes the addition ID from the route and responds with 204', async (context) => {
    const useCase = new DeleteAddition(createAdditionRepository());
    const remove = context.mock.method(useCase, 'delete');
    const controller = new DeleteAdditionController(useCase);
    const request = { params: { additionId: 'addition-1' } } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const send = context.mock.fn(() => response);
    response.send = send;
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(remove.mock.calls[0].arguments, [{ additionId: 'addition-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [204]);
    assert.equal(send.mock.callCount(), 1);
    assert.equal(json.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards deletion errors to the error handler', async (context) => {
    const failure = new Error('Database unavailable');
    const useCase = new DeleteAddition(createAdditionRepository({ deleteById: async () => { throw failure; } }));
    const controller = new DeleteAdditionController(useCase);
    const { response, status } = createResponse(context);
    const send = context.mock.fn(() => response);
    response.send = send;
    const next = context.mock.fn();

    await controller.execute({ params: { additionId: 'addition-1' } } as unknown as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(send.mock.callCount(), 0);
  });
});
