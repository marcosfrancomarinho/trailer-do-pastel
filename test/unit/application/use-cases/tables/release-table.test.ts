import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ReleaseTable } from '../../../../../src/application/use-cases/tables/release-table.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';

describe('ReleaseTable', () => {
  it('validates the table ID and returns the released table', async (context) => {
    const release = context.mock.fn(async (id: string) => {
      assert.equal(id, 'table-1');
      return { id, status: 'FREE' as const, totalSpent: '0', sessionId: 'session-1', closedTotal: '25.5' };
    });
    const useCase = new ReleaseTable({
      existsByNumber: async () => false,
      save: async () => 'unused',
      release,
    });

    assert.deepEqual(await useCase.release({ tableId: ' table-1 ' }), {
      id: 'table-1', status: 'FREE', totalSpent: '0', sessionId: 'session-1', closedTotal: '25.5',
    });
    await assert.rejects(
      useCase.release({ tableId: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'tableId',
    );
    assert.equal(release.mock.callCount(), 1);
  });
});
