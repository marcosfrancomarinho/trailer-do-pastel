import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ApplicationError } from '../../../../../../src/application/errors/application-error.js';
import { CreateCategory } from '../../../../../../src/application/use-cases/categories/create-category.js';
import { DomainError } from '../../../../../../src/domain/errors/domain-error.js';
import { CreateCategoryController } from '../../../../../../src/infrastructure/http/controllers/categories/create-category-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('CreateCategoryController', () => {
  it('passes only the name and responds with the created ID', async (context) => {
    const useCase = new CreateCategory({
      findByName: async () => null,
      reactivate: async (id: string) => id,
      existsById: async () => false,
      existsByName: async () => false,
      save: async () => 'category-id',
    });
    const create = context.mock.method(useCase, 'create');
    const controller = new CreateCategoryController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ body: { name: 'Pastéis', id: 'ignored-id' } } as Request, response, next);

    assert.deepEqual(create.mock.calls[0].arguments, [{ name: 'Pastéis' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [201]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'category-id' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards validation, duplicate and unexpected errors without writing a response', async (context) => {
    const errors = [
      new DomainError('name', 'EMPTY', 'Nome inválido.'),
      new ApplicationError('name', 'ALREADY_EXISTS', 'Categoria já cadastrada.'),
      new Error('Database unavailable'),
    ];

    for (const error of errors) {
      const useCase = new CreateCategory({ findByName: async () => null,
      reactivate: async (id: string) => id,
      existsById: async () => false, existsByName: async () => false, save: async () => 'category-id' });
      context.mock.method(useCase, 'create', async () => { throw error; });
      const controller = new CreateCategoryController(useCase);
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ body: { name: 'Pastéis' } } as Request, response, next);

      assert.deepEqual(next.mock.calls[0].arguments, [error]);
      assert.equal(next.mock.callCount(), 1);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
    }
  });

  it('forwards a missing name as a domain error', async (context) => {
    const useCase = new CreateCategory({ findByName: async () => null,
      reactivate: async (id: string) => id,
      existsById: async () => false, existsByName: async () => false, save: async () => 'category-id' });
    const controller = new CreateCategoryController(useCase);
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
