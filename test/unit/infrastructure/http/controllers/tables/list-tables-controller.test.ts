import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListTables } from '../../../../../../src/application/use-cases/tables/list-tables.js';
import { ListTablesController } from '../../../../../../src/infrastructure/http/controllers/tables/list-tables-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('ListTablesController', () => {
  it('responds with the table list', async (context) => {
    const tables = [{ id: 'table-1', number: 1, status: 'OCCUPIED' as const, totalSpent: '35.5' }];
    const controller = new ListTablesController(new ListTables({ findAll: async () => tables }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [tables]);
    assert.equal(next.mock.callCount(), 0);
  });
});
