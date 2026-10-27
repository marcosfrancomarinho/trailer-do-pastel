import { EventObserver } from '../../../../../../src/application/observer/event-observer.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ReleaseTable } from '../../../../../../src/application/use-cases/tables/release-table.js';
import { ReleaseTableController } from '../../../../../../src/infrastructure/http/controllers/tables/release-table-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('ReleaseTableController', () => {
  it('releases the requested table and responds with 200', async (context) => {
    const useCase = new ReleaseTable({
      existsByNumber: async () => false,
      save: async () => 'unused',
      release: async (id) => ({ id, status: 'FREE', totalSpent: '0', sessionId: 'session-1', closedTotal: '25.5' }),
    }, new EventObserver());
    const release = context.mock.method(useCase, 'release');
    const controller = new ReleaseTableController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { tableId: 'table-1' } } as unknown as Request, response, next);

    assert.deepEqual(release.mock.calls[0].arguments, [{ tableId: 'table-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{
      id: 'table-1', status: 'FREE', totalSpent: '0', sessionId: 'session-1', closedTotal: '25.5',
    }]);
    assert.equal(next.mock.callCount(), 0);
  });
});
