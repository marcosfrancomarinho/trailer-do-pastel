import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListTableOrders } from '../../../../../src/application/use-cases/tables/list-table-orders.js';
import { ApplicationError } from '../../../../../src/application/errors/application-error.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';

describe('ListTableOrders', () => {
  it('normalizes the table ID and returns its orders', async (context) => {
    const result = { tableId: 'table-1', number: 1, status: 'OCCUPIED' as const, totalSpent: '25.5', sessionId: 'session-1', orders: [] };
    const findByTableId = context.mock.fn(async () => result);
    const useCase = new ListTableOrders({ findByTableId });

    assert.deepEqual(await useCase.list({ tableId: ' table-1 ' }), result);
    assert.deepEqual(findByTableId.mock.calls[0].arguments, ['table-1']);
  });

  it('returns 404 for a missing table and rejects an invalid ID before querying', async (context) => {
    const findByTableId = context.mock.fn(async () => null);
    const useCase = new ListTableOrders({ findByTableId });

    await assert.rejects(
      useCase.list({ tableId: 'missing' }),
      (error: unknown) => error instanceof ApplicationError && error.field === 'tableId' && error.code === 'NOT_FOUND',
    );
    await assert.rejects(
      useCase.list({ tableId: '  ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'tableId',
    );
    assert.equal(findByTableId.mock.callCount(), 1);
  });
});
