import { EventObserver } from '../../../../../../src/application/observer/event-observer.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { CreateTable } from '../../../../../../src/application/use-cases/tables/create-table.js';
import { DomainError } from '../../../../../../src/domain/errors/domain-error.js';
import { CreateTableController } from '../../../../../../src/infrastructure/http/controllers/tables/create-table-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('CreateTableController', () => {
  it('accepts only the number and responds with 201', async (context) => {
    const useCase = new CreateTable({ existsByNumber: async () => false, save: async () => 'table-id' }, new EventObserver());
    const create = context.mock.method(useCase, 'create');
    const controller = new CreateTableController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ body: { number: 12, id: 'ignored' } } as Request, response, next);

    assert.deepEqual(create.mock.calls[0].arguments, [{ number: 12 }]);
    assert.deepEqual(status.mock.calls[0].arguments, [201]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'table-id', status: 'FREE', totalSpent: '0' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes an explicit status to the use case', async (context) => {
    const useCase = new CreateTable({ existsByNumber: async () => false, save: async () => 'table-id' }, new EventObserver());
    const create = context.mock.method(useCase, 'create');
    const controller = new CreateTableController(useCase);
    const { response, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ body: { number: 12, status: 'OCCUPIED' } } as Request, response, next);

    assert.deepEqual(create.mock.calls[0].arguments, [{ number: 12, status: 'OCCUPIED' }]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'table-id', status: 'OCCUPIED', totalSpent: '0' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards missing number as a domain error', async (context) => {
    const useCase = new CreateTable({ existsByNumber: async () => false, save: async () => 'table-id' }, new EventObserver());
    const controller = new CreateTableController(useCase);
    const { response, status } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof DomainError);
    assert.equal(error.field, 'number');
    assert.equal(error.code, 'REQUIRED');
    assert.equal(status.mock.callCount(), 0);
  });
});
