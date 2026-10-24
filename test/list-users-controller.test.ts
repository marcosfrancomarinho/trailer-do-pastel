import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListUsers } from '../src/application/use-cases/users/list-users.js';
import { ListUsersController } from '../src/infrastructure/http/controllers/users/list-users-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('ListUsersController', () => {
  it('responds with the safe user list', async (context) => {
    const users = [{ id: 'user-1', name: 'Marcos', role: 'ADMIN' as const, createdAt: '2026-10-23T10:00:00.000Z' }];
    const controller = new ListUsersController(new ListUsers({ findAll: async () => users }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [users]);
    assert.equal(next.mock.callCount(), 0);
  });
});
