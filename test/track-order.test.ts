import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { TrackOrder } from '../src/application/use-cases/orders/track-order.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { OrderQueries } from '../src/application/queries/order-queries.js';

describe('TrackOrder', () => {
  it('looks up an order by its normalized tracking token', async (context) => {
    const result = { status: 'PREPARING' as const, updatedAt: '2026-10-22T12:00:00.000Z' };
    const findByTrackingToken = context.mock.fn(async () => result);
    const queries = { findPending: async () => [], findByTrackingToken } satisfies OrderQueries;

    assert.deepEqual(await new TrackOrder(queries).track({ trackingToken: ' token-1 ' }), result);
    assert.deepEqual(findByTrackingToken.mock.calls[0].arguments, ['token-1']);
  });

  it('returns NOT_FOUND for an unknown token', async () => {
    const queries = {
      findPending: async () => [],
      findByTrackingToken: async () => null,
    } satisfies OrderQueries;

    await assert.rejects(
      new TrackOrder(queries).track({ trackingToken: 'unknown' }),
      (error: unknown) => error instanceof ApplicationError
        && error.field === 'trackingToken'
        && error.code === 'NOT_FOUND',
    );
  });

  it('rejects an empty token before querying', async (context) => {
    const findByTrackingToken = context.mock.fn(async () => null);
    const queries = { findPending: async () => [], findByTrackingToken } satisfies OrderQueries;

    await assert.rejects(
      new TrackOrder(queries).track({ trackingToken: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'trackingToken',
    );
    assert.equal(findByTrackingToken.mock.callCount(), 0);
  });
});
