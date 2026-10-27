import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { DeleteUser } from '../../../../../../src/application/use-cases/users/delete-user.js';
import type { UserRepository } from '../../../../../../src/domain/repositories/user-repository.js';
import { DeleteUserController } from '../../../../../../src/infrastructure/http/controllers/users/delete-user-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('DeleteUserController', () => {
  it('uses the authenticated user ID and responds with 204', async (context) => {
    const deleteById = context.mock.fn(async (_id: string) => {});
    const useCase = new DeleteUser({ existsById: async () => true, deleteById } as unknown as UserRepository);
    const controller = new DeleteUserController(useCase);
    const { response, status, json } = createResponse(context);
    response.locals.userId = 'user-1';
    const send = context.mock.fn(() => response);
    response.send = send;
    const next = context.mock.fn();

    await controller.execute({ params: { userId: 'user-2' } } as unknown as Request, response, next);

    assert.deepEqual(deleteById.mock.calls[0].arguments, ['user-2']);
    assert.deepEqual(status.mock.calls[0].arguments, [204]);
    assert.equal(send.mock.callCount(), 1);
    assert.equal(json.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 0);
  });
});
