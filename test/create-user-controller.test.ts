import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { CreateUser } from '../src/application/use-cases/create-user.js';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { CreateUserController } from '../src/infrastructure/http/controllers/create-user-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

function createUseCase(): CreateUser {
  return new CreateUser({
    existsByName: async () => false,
    save: async () => 'user-id',
  }, {
    hash: async () => '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    match: async () => false,
  });
}

describe('CreateUserController', () => {
  it('passes only name and password to the injected use case and responds with 201 and the ID', async (context) => {
    const useCase = createUseCase();
    const create = context.mock.method(useCase, 'create');
    const controller = new CreateUserController(useCase);
    const request = { body: { name: 'Marcos', password: 'Senha1234', id: 'ignored-id', admin: true } } as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(create.mock.calls[0].arguments, [{ name: 'Marcos', password: 'Senha1234' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [201]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'user-id' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards use case errors to next without writing a response', async (context) => {
    const errors = [
      new DomainError('password', 'TOO_SHORT', 'Senha curta.'),
      new ApplicationError('name', 'ALREADY_EXISTS', 'Usuário já cadastrado.'),
      new Error('Database unavailable'),
    ];

    for (const error of errors) {
      const useCase = createUseCase();
      context.mock.method(useCase, 'create', async () => { throw error; });
      const controller = new CreateUserController(useCase);
      const request = { body: { name: 'Marcos', password: 'Senha1234' } } as Request;
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute(request, response, next);

      assert.deepEqual(next.mock.calls[0].arguments, [error]);
      assert.equal(next.mock.callCount(), 1);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
    }
  });

  it('forwards the domain validation error when the request has no body', async (context) => {
    const controller = new CreateUserController(createUseCase());
    const { response, status } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof DomainError);
    assert.equal(error.field, 'name');
    assert.equal(error.code, 'REQUIRED');
    assert.equal(status.mock.callCount(), 0);
  });
});
