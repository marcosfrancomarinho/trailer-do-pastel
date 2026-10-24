import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { ListClosedTableSessions } from '../src/application/use-cases/tables/list-closed-table-sessions.js';

describe('ListClosedTableSessions', () => {
  it('forwards the selected date to the query', async () => {
    let receivedDate: string | undefined;
    const useCase = new ListClosedTableSessions({
      findClosedSessions: async date => { receivedDate = date; return []; },
    } as ConstructorParameters<typeof ListClosedTableSessions>[0]);
    assert.deepEqual(await useCase.list('2026-10-24'), { comandas: [] });
    assert.equal(receivedDate, '2026-10-24');
    assert.deepEqual(await useCase.list(), { comandas: [] });
    assert.equal(receivedDate, undefined);
  });

  it('rejects invalid dates before querying', async () => {
    let calls = 0;
    const useCase = new ListClosedTableSessions({
      findClosedSessions: async () => { calls++; return []; },
    } as ConstructorParameters<typeof ListClosedTableSessions>[0]);
    for (const date of ['2026-02-30', '2026-13-01', '24/10/2026', '']) {
      await assert.rejects(useCase.list(date), (error: unknown) =>
        error instanceof DomainError && error.field === 'date');
    }
    assert.equal(calls, 0);
  });
});
