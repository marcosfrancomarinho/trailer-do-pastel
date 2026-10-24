import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { DeleteTable } from '../src/application/use-cases/tables/delete-table.js';
import { DeleteTableController } from '../src/infrastructure/http/controllers/tables/delete-table-controller.js';
import { createResponse } from './helpers/http-fixtures.js';
import type { TableRepository } from '../src/domain/repositories/table-repository.js';

describe('DeleteTableController', () => {
  it('returns 204 after archiving the table', async (context) => {
    const archive = context.mock.fn(async () => {});
    const controller = new DeleteTableController(new DeleteTable({ archive } as unknown as TableRepository));
    const request = { params: { tableId: 'table-1' } } as unknown as Request;
    const { response, status } = createResponse(context);
    const send = context.mock.fn();
    response.send = send;
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(archive.mock.calls[0].arguments, ['table-1']);
    assert.deepEqual(status.mock.calls[0].arguments, [204]);
    assert.equal(send.mock.callCount(), 1);
    assert.equal(next.mock.callCount(), 0);
  });
});
