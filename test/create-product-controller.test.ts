import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { CreateProduct } from '../src/application/use-cases/create-product.js';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { CreateProductController } from '../src/infrastructure/http/controllers/create-product-controller.js';
import { createResponse } from './helpers/http-fixtures.js';
import { createProductRepository } from './helpers/order-fixtures.js';

describe('CreateProductController', () => {
  const input = { name: 'Pastel', description: 'Queijo', price: '12.50', available: false };

  it('maps the input fields and responds with 201 and the created ID', async (context) => {
    const repository = createProductRepository({
      async save(product) {
        assert.equal(product.isAvailable(), false);
        return 'product-id';
      },
    });
    const useCase = new CreateProduct(repository);
    const create = context.mock.method(useCase, 'create');
    const controller = new CreateProductController(useCase);
    const request = { body: { ...input, id: 'ignored-id' } } as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(create.mock.calls[0].arguments, [input]);
    assert.deepEqual(status.mock.calls[0].arguments, [201]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'product-id' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards domain, application and unexpected errors without writing a response', async (context) => {
    const errors = [
      new DomainError('price', 'NON_POSITIVE', 'Preço inválido.'),
      new ApplicationError('name', 'ALREADY_EXISTS', 'Nome já cadastrado.'),
      new Error('Database unavailable'),
    ];

    for (const error of errors) {
      const useCase = new CreateProduct(createProductRepository());
      context.mock.method(useCase, 'create', async () => { throw error; });
      const controller = new CreateProductController(useCase);
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ body: input } as Request, response, next);

      assert.deepEqual(next.mock.calls[0].arguments, [error]);
      assert.equal(next.mock.callCount(), 1);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
    }
  });
});
