import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListAdditions } from '../src/application/use-cases/additions/list-additions.js';
import { ListAdditionsController } from '../src/infrastructure/http/controllers/additions/list-additions-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('ListAdditionsController', () => {
  it('returns additions with status 200', async (context) => {
    const additions = [{ id: 'addition-1', name: 'Queijo extra', price: '2.5', available: false }];
    const findAll = context.mock.fn(async () => additions);
    const controller = new ListAdditionsController(new ListAdditions({ findAll, findByProductId: async () => [] }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.equal(findAll.mock.callCount(), 1);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [additions]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('returns an empty list with status 200', async (context) => {
    const controller = new ListAdditionsController(new ListAdditions({
      findAll: async () => [],
      findByProductId: async () => [],
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [[]]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards query failures without writing a response', async (context) => {
    const failure = new Error('Database unavailable');
    const controller = new ListAdditionsController(new ListAdditions({
      findAll: async () => { throw failure; },
      findByProductId: async () => [],
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
