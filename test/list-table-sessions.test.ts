import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { ListTableSessions } from '../src/application/use-cases/tables/list-table-sessions.js';

describe('ListTableSessions', () => {
  it('returns the comandas of the requested table', async () => {
    const expected = { tableId: 'table-1', sessions: [] };
    const useCase = new ListTableSessions({
      findByTableId: async () => null,
      findSessionsByTableId: async (id) => id === 'table-1' ? expected : null,
    });
    assert.deepEqual(await useCase.list({ tableId: ' table-1 ' }), expected);
    await assert.rejects(useCase.list({ tableId: 'missing' }),
      (error: unknown) => error instanceof ApplicationError && error.code === 'NOT_FOUND');
  });
});
