import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListProductsByCategory } from '../../../../../../src/application/use-cases/products/list-products-by-category.js';
import { DomainError } from '../../../../../../src/domain/errors/domain-error.js';
import { ListProductsByCategoryController } from '../../../../../../src/infrastructure/http/controllers/products/list-products-by-category-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('ListProductsByCategoryController', () => {
  it('returns the category products with status 200', async (context) => {
    const products = [{
      id: 'product-1',
      name: 'Pastel de queijo',
      description: 'Queijo e orégano',
      categoryId: 'category-1',
      price: '12.50',
      imageUrl: 'https://example.com/pastel.jpg',
      available: true,
    }];
    const findByCategoryId = context.mock.fn(async () => products);
    const controller = new ListProductsByCategoryController(new ListProductsByCategory({ findAll: async () => [], findByCategoryId }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { categoryId: 'category-1' } } as unknown as Request, response, next);

    assert.deepEqual(findByCategoryId.mock.calls[0].arguments, ['category-1']);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [products]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards invalid category IDs to the error handler', async (context) => {
    const findByCategoryId = context.mock.fn(async () => []);
    const controller = new ListProductsByCategoryController(new ListProductsByCategory({ findAll: async () => [], findByCategoryId }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { categoryId: ' ' } } as unknown as Request, response, next);

    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof DomainError);
    assert.equal(error.field, 'categoryId');
    assert.equal(findByCategoryId.mock.callCount(), 0);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
