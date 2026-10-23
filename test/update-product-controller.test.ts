import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { UpdateProduct } from '../src/application/use-cases/products/update-product.js';
import { UpdateProductController } from '../src/infrastructure/http/controllers/products/update-product-controller.js';
import { createAdditionRepository, createCategoryRepository, createProductRepository } from './helpers/order-fixtures.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('UpdateProductController', () => {
  it('takes the ID from the URL and returns 200 with the updated ID', async (context) => {
    const useCase = new UpdateProduct(createProductRepository(), createAdditionRepository(), createCategoryRepository());
    const update = context.mock.method(useCase, 'update', async () => ({ id: 'product-1' }));
    const controller = new UpdateProductController(useCase);
    const request = {
      params: { productId: 'product-1' },
      body: { price: '14.50', imageUrl: 'https://example.com/pastel.jpg', id: 'ignored' },
    } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.equal(update.mock.calls[0].arguments[0].productId, 'product-1');
    assert.equal(update.mock.calls[0].arguments[0].price, '14.50');
    assert.equal(update.mock.calls[0].arguments[0].imageUrl, 'https://example.com/pastel.jpg');
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'product-1' }]);
    assert.equal(next.mock.callCount(), 0);
  });
});
