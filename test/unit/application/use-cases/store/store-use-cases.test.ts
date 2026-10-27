import { EventObserver } from '../../../../../src/application/observer/event-observer.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GetStoreStatus } from '../../../../../src/application/use-cases/store/get-store-status.js';
import { SetStoreStatus } from '../../../../../src/application/use-cases/store/set-store-status.js';
import type { StoreRepository } from '../../../../../src/domain/repositories/store-repository.js';

describe('Store use cases', () => {
  for (const status of ['OPEN', 'CLOSED'] as const) {
    it(`returns stored ${status} status without writing`, async (context) => {
      const result = { status, updatedAt: '2026-10-27T12:00:00Z' };
      const getStatus = context.mock.fn(async () => result);
      const setStatus = context.mock.fn(async () => result);
      assert.strictEqual(await new GetStoreStatus({ getStatus, setStatus }).get(), result);
      assert.equal(getStatus.mock.callCount(), 1);
      assert.equal(setStatus.mock.callCount(), 0);
    });
  }

  for (const [method, status] of [['open', 'OPEN'], ['close', 'CLOSED']] as const) {
    it(`${method} persists the requested status and returns the repository timestamp`, async (context) => {
      const result = { status, updatedAt: '2026-10-27T12:00:00Z' };
      const setStatus = context.mock.fn(async (_status: 'OPEN' | 'CLOSED') => result);
      const getStatus = context.mock.fn(async () => result);
      assert.strictEqual(await new SetStoreStatus({ getStatus, setStatus }, new EventObserver())[method](), result);
      assert.deepEqual(setStatus.mock.calls.map(call => call.arguments), [[status]]);
      assert.equal(getStatus.mock.callCount(), 0);
    });
  }

  for (const method of ['get', 'open', 'close'] as const) {
    it(`propagates ${method} failures unchanged`, async () => {
      const failure = new Error('Storage unavailable');
      const fail = async () => { throw failure; };
      const repository: StoreRepository = { getStatus: fail, setStatus: fail };
      await assert.rejects(method === 'get' ? new GetStoreStatus(repository).get()
        : new SetStoreStatus(repository, new EventObserver())[method](), (error: unknown) => error === failure);
    });
  }
});
