import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListProducts } from '../../../../../../src/application/use-cases/products/list-products.js';
import { ListProductsController } from '../../../../../../src/infrastructure/http/controllers/products/list-products-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('ListProductsController', () => {
  it('returns all products with status 200', async (context) => {
    const products = [{
      id: 'product-1',
      name: 'Pastel de queijo',
      description: 'Queijo e orégano',
      categoryId: 'category-1',
      price: '12.5',
      imageUrl: 'https://example.com/pastel.jpg',
      available: false,
    }];
    const findAll = context.mock.fn(async () => products);
    const controller = new ListProductsController(new ListProducts({ findAll, findByCategoryId: async () => [] }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.equal(findAll.mock.callCount(), 1);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [products]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('returns an empty list with status 200', async (context) => {
    const controller = new ListProductsController(new ListProducts({
      findAll: async () => [],
      findByCategoryId: async () => [],
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [[]]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards query failures without writing a response', async (context) => {
    const failure = new Error('Database unavailable');
    const controller = new ListProductsController(new ListProducts({
      findAll: async () => { throw failure; },
      findByCategoryId: async () => [],
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
