import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ApplicationError } from '../../../../../src/application/errors/application-error.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import { ErrorHandler } from '../../../../../src/infrastructure/http/middlewares/error-handler.js';
import { InfrastructureError, type InfrastructureErrorCode } from '../../../../../src/infrastructure/errors/infrastructure-error.js';
import { createResponse } from '../../../../helpers/http-fixtures.js';

describe('ErrorHandler', () => {
  it('preserves HTTP statuses for infrastructure errors and hides technical failures', (context) => {
    const cases: Array<{ code: InfrastructureErrorCode; expectedStatus: number }> = [
      { code: 'ALREADY_EXISTS', expectedStatus: 409 },
      { code: 'NOT_FOUND', expectedStatus: 404 },
      { code: 'UNAVAILABLE', expectedStatus: 409 },
      { code: 'IN_USE', expectedStatus: 409 },
      { code: 'UNAUTHORIZED', expectedStatus: 401 },
      { code: 'FORBIDDEN', expectedStatus: 403 },
      { code: 'CONNECTION_FAILED', expectedStatus: 500 },
      { code: 'PERSISTENCE_FAILED', expectedStatus: 500 },
      { code: 'EXTERNAL_SERVICE_FAILED', expectedStatus: 500 },
      { code: 'TIMEOUT', expectedStatus: 500 },
      { code: 'INVALID_CONFIGURATION', expectedStatus: 500 },
    ];

    for (const { code, expectedStatus } of cases) {
      const error = new InfrastructureError('resource', code, 'Failure details');
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      new ErrorHandler().execute(error, {} as Request, response, next);

      assert.deepEqual(status.mock.calls[0].arguments, [expectedStatus]);
      assert.deepEqual(json.mock.calls[0].arguments, [expectedStatus === 500
        ? { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' }
        : { field: error.field, code, message: error.message }]);
      assert.equal(next.mock.callCount(), 0);
    }
  });

  it('maps domain and application errors to HTTP responses', (context) => {
    const handler = new ErrorHandler();
    const cases = [
      { error: new DomainError('password', 'TOO_SHORT', 'Senha curta.'), expectedStatus: 400 },
      { error: new ApplicationError('name', 'ALREADY_EXISTS', 'Usuário já cadastrado.'), expectedStatus: 409 },
      { error: new ApplicationError('productId', 'NOT_FOUND', 'Produto não encontrado.'), expectedStatus: 404 },
      { error: new ApplicationError('productId', 'UNAVAILABLE', 'Produto indisponível.'), expectedStatus: 409 },
      { error: new ApplicationError('productId', 'IN_USE', 'Produto usado em pedidos.'), expectedStatus: 409 },
      { error: new ApplicationError('additionId', 'NOT_ASSOCIATED', 'Adicional não pertence ao produto.'), expectedStatus: 400 },
      { error: new ApplicationError('credentials', 'INVALID_CREDENTIALS', 'Nome ou senha inválidos.'), expectedStatus: 401 },
      { error: new ApplicationError('authorization', 'UNAUTHORIZED', 'Token inválido.'), expectedStatus: 401 },
      { error: new ApplicationError('authorization', 'FORBIDDEN', 'Exige admin.'), expectedStatus: 403 },
    ];

    for (const { error, expectedStatus } of cases) {
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      handler.execute(error, {} as Request, response, next);

      assert.deepEqual(status.mock.calls[0].arguments, [expectedStatus]);
      assert.deepEqual(json.mock.calls[0].arguments, [{ field: error.field, code: error.code, message: error.message }]);
      assert.equal(next.mock.callCount(), 0);
    }
  });

  it('returns 500 for unexpected errors without exposing internal details', (context) => {
    const handler = new ErrorHandler();

    for (const error of [new Error('Database connection details'), 'unexpected error', null, undefined]) {
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      handler.execute(error, {} as Request, response, next);

      assert.deepEqual(status.mock.calls[0].arguments, [500]);
      assert.deepEqual(json.mock.calls[0].arguments, [{ code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' }]);
      assert.equal(next.mock.callCount(), 0);
    }
  });

  it('forwards the error when the response headers have already been sent', (context) => {
    const error = new Error('Response already started');
    const { response, status, json } = createResponse(context, true);
    const next = context.mock.fn();

    new ErrorHandler().execute(error, {} as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [error]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
