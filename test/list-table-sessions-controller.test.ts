import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListTableSessions } from '../src/application/use-cases/tables/list-table-sessions.js';
import { ListTableSessionsController } from '../src/infrastructure/http/controllers/tables/list-table-sessions-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('ListTableSessionsController', () => {
  it('responds with the history of the table', async (context) => {
    const result = { tableId: 'table-1', sessions: [] };
    const controller = new ListTableSessionsController(new ListTableSessions({
      findByTableId: async () => null,
      findSessionsByTableId: async () => result,
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();
    await controller.execute({ params: { tableId: 'table-1' } } as unknown as Request, response, next);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [result]);
    assert.equal(next.mock.callCount(), 0);
  });
});
