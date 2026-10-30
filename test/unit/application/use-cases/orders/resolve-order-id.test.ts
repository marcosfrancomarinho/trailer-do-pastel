import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ResolveOrderId } from '../../../../../src/application/use-cases/orders/resolve-order-id.js';
import { ApplicationError } from '../../../../../src/application/errors/application-error.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import type { OrderQueries } from '../../../../../src/application/queries/order-queries.js';

describe('ResolveOrderId', () => {
  it('returns the ID using the normalized token', async (context) => {
    const findOrderIdByTrackingToken = context.mock.fn(async () => 'order-1');
    const useCase = new ResolveOrderId({ findOrderIdByTrackingToken } as unknown as OrderQueries);

    assert.deepEqual(await useCase.resolve({ trackingToken: ' token-1 ' }), { id: 'order-1' });
    assert.deepEqual(findOrderIdByTrackingToken.mock.calls[0].arguments, ['token-1']);
  });

  it('rejects an unknown token', async () => {
    const useCase = new ResolveOrderId({
      findOrderIdByTrackingToken: async () => null,
    } as unknown as OrderQueries);

    await assert.rejects(useCase.resolve({ trackingToken: 'missing' }), (error: unknown) =>
      error instanceof ApplicationError && error.field === 'trackingToken' && error.code === 'NOT_FOUND');
  });

  it('rejects an invalid token before querying', async (context) => {
    const findOrderIdByTrackingToken = context.mock.fn(async () => null);
    const useCase = new ResolveOrderId({ findOrderIdByTrackingToken } as unknown as OrderQueries);

    await assert.rejects(useCase.resolve({ trackingToken: ' ' }), DomainError);
    assert.equal(findOrderIdByTrackingToken.mock.callCount(), 0);
  });

  it('propagates query failures', async () => {
    const failure: Error = new Error('Query failed');
    const useCase = new ResolveOrderId({
      findOrderIdByTrackingToken: async () => { throw failure; },
    } as unknown as OrderQueries);

    await assert.rejects(useCase.resolve({ trackingToken: 'token-1' }), (error: unknown) => error === failure);
  });
});
