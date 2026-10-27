import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { ListClosedTableSessions } from '../src/application/use-cases/tables/list-closed-table-sessions.js';
import { ListClosedTableSessionsController } from '../src/infrastructure/http/controllers/tables/list-closed-table-sessions-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('ListClosedTableSessionsController', () => {
  it('returns closed sessions for the requested date', async (context) => {
    const findClosedSessions = context.mock.fn(async () => []);
    const useCase = new ListClosedTableSessions({ findClosedSessions } as never);
    const controller = new ListClosedTableSessionsController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ query: { date: '2026-10-24' } } as unknown as Request, response, next);

    assert.deepEqual(findClosedSessions.mock.calls[0].arguments, ['2026-10-24']);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ comandas: [] }]);
    assert.equal(next.mock.callCount(), 0);
  });

  for (const date of [undefined, ['2026-10-24']]) {
    it(`rejects a missing or non-string date: ${String(date)}`, async (context) => {
      const findClosedSessions = context.mock.fn(async () => []);
      const useCase = new ListClosedTableSessions({ findClosedSessions } as never);
      const controller = new ListClosedTableSessionsController(useCase);
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ query: { date } } as unknown as Request, response, next);

      assert.equal(findClosedSessions.mock.callCount(), 0);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
      assert.equal(next.mock.calls[0].arguments[0] instanceof DomainError, true);
    });
  }
});
