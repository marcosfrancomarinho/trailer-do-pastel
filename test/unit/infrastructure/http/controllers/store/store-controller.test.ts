import { EventObserver } from '../../../../../../src/application/observer/event-observer.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { GetStoreStatus } from '../../../../../../src/application/use-cases/store/get-store-status.js';
import { SetStoreStatus } from '../../../../../../src/application/use-cases/store/set-store-status.js';
import { StoreState } from '../../../../../../src/domain/entities/store-state.js';
import { StoreController } from '../../../../../../src/infrastructure/http/controllers/store/store-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('StoreController', () => {
  it('returns status and opens or closes through the use cases', async (context) => {
    let current = 'OPEN' as 'OPEN' | 'CLOSED';
    const repository = {
      getStatus: async () => StoreState.create(current, new Date('2026-10-23T12:00:00.000Z')),
      setStatus: async (status: 'OPEN' | 'CLOSED') => {
        current = status;
        return StoreState.create(current, new Date('2026-10-23T12:00:00.000Z'));
      },
    };
    const controller = new StoreController(new GetStoreStatus(repository), new SetStoreStatus(repository, new EventObserver()));
    const { response, status, json } = createResponse(context);
    const setHeader = context.mock.fn(() => response);
    response.set = setHeader;
    const next = context.mock.fn();

    await controller.getStatus({} as Request, response, next);
    await controller.close({} as Request, response, next);
    await controller.open({} as Request, response, next);

    assert.deepEqual(status.mock.calls.map((call) => call.arguments[0]), [200, 200, 200]);
    assert.deepEqual(json.mock.calls.map((call) => call.arguments[0].status), ['OPEN', 'CLOSED', 'OPEN']);
    assert.deepEqual(setHeader.mock.calls[0].arguments, ['Cache-Control', 'no-store']);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards storage failures for status, opening and closing without sending a success response', async (context) => {
    const failure = new Error('Database unavailable');
    const repository = {
      getStatus: async () => { throw failure; },
      setStatus: async () => { throw failure; },
    };
    const controller = new StoreController(new GetStoreStatus(repository), new SetStoreStatus(repository, new EventObserver()));

    for (const method of ['getStatus', 'open', 'close'] as const) {
      const { response, status, json } = createResponse(context);
      response.set = context.mock.fn(() => response);
      const next = context.mock.fn();

      await controller[method]({} as Request, response, next);

      assert.deepEqual(next.mock.calls[0].arguments, [failure]);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
    }
  });
});
