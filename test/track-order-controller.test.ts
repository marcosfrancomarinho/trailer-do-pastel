import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { TrackOrder } from '../src/application/use-cases/orders/track-order.js';
import { TrackOrderController } from '../src/infrastructure/http/controllers/orders/track-order-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('TrackOrderController', () => {
  it('takes the tracking token from the route and returns the latest status', async (context) => {
    const result = { status: 'COMPLETED' as const, updatedAt: '2026-10-22T12:00:00.000Z' };
    const useCase = new TrackOrder({ findPending: async () => [], findByTrackingToken: async () => result });
    const track = context.mock.method(useCase, 'track');
    const controller = new TrackOrderController(useCase);
    const request = { params: { trackingToken: 'token-1' } } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const setHeader = context.mock.fn((_name: string, _value: string) => response);
    response.setHeader = setHeader;
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(track.mock.calls[0].arguments, [{ trackingToken: 'token-1' }]);
    assert.deepEqual(setHeader.mock.calls[0].arguments, ['Cache-Control', 'no-store']);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [result]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards errors without writing a response', async (context) => {
    const failure = new Error('Database unavailable');
    const useCase = new TrackOrder({
      findPending: async () => [],
      findByTrackingToken: async () => { throw failure; },
    });
    const controller = new TrackOrderController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { trackingToken: 'token-1' } } as unknown as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
