import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { LoginUser } from '../../../../../../src/application/use-cases/users/login-user.js';
import { ApplicationError } from '../../../../../../src/application/errors/application-error.js';
import { LoginUserController } from '../../../../../../src/infrastructure/http/controllers/users/login-user-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

function createUseCase(): LoginUser {
  return new LoginUser(
    { findByName: async () => null, existsByName: async () => false, save: async () => 'unused' },
    { hash: async () => 'unused', match: async () => false },
    { issue: async () => 'unused', verify: async () => null },
  );
}

describe('LoginUserController', () => {
  it('passes the credentials to the use case and returns the name, role and token with status 200', async (context) => {
    const useCase = createUseCase();
    const login = context.mock.method(useCase, 'login', async () => ({ name: 'Marcos', role: 'ADMIN', accessToken: 'signed-token' }));
    const controller = new LoginUserController(useCase);
    const request = { body: { name: 'Marcos', password: 'Senha1234', admin: true } } as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(login.mock.calls[0].arguments, [{ name: 'Marcos', password: 'Senha1234' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ name: 'Marcos', role: 'ADMIN', accessToken: 'signed-token' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards invalid credentials to the error handler without writing a response', async (context) => {
    const error = new ApplicationError('credentials', 'INVALID_CREDENTIALS', 'Nome ou senha inválidos.');
    const useCase = createUseCase();
    context.mock.method(useCase, 'login', async () => { throw error; });
    const controller = new LoginUserController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ body: { name: 'Marcos', password: 'SenhaErrada1' } } as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [error]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
