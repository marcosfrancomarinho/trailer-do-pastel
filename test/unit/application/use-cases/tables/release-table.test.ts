import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EventObserver } from '../../../../../src/application/observer/event-observer.js';
import { ReleaseTable } from '../../../../../src/application/use-cases/tables/release-table.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';

describe('ReleaseTable', () => {
  it('validates the table ID and returns the released table', async (context) => {
    const release = context.mock.fn(async (id: string) => {
      assert.equal(id, 'table-1');
      return { id, status: 'FREE' as const, totalSpent: '0', sessionId: 'session-1', closedTotal: '25.5' };
    });
    const observer = new EventObserver();
    const notifications: unknown[] = [];
    observer.register({ handle: async (event: unknown) => { notifications.push(event); } });
    const useCase = new ReleaseTable({
      existsByNumber: async () => false,
      save: async () => 'unused',
      release,
    }, observer);

    assert.deepEqual(await useCase.release({ tableId: ' table-1 ' }), {
      id: 'table-1', status: 'FREE', totalSpent: '0', sessionId: 'session-1', closedTotal: '25.5',
    });
    await assert.rejects(
      useCase.release({ tableId: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'tableId',
    );
    assert.equal(release.mock.callCount(), 1);
    assert.deepEqual(notifications, [{ orderId: '', status: 'TABLE_RELEASED', tableId: 'table-1' }]);
  });
});
