import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { DeleteProduct } from '../../../../../../src/application/use-cases/products/delete-product.js';
import { DeleteProductController } from '../../../../../../src/infrastructure/http/controllers/products/delete-product-controller.js';
import { createProductRepository } from '../../../../../helpers/order-fixtures.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('DeleteProductController', () => {
  it('takes the product ID from the route and responds with 204', async (context) => {
    const useCase = new DeleteProduct(createProductRepository());
    const remove = context.mock.method(useCase, 'delete');
    const controller = new DeleteProductController(useCase);
    const request = { params: { productId: 'product-1' } } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const send = context.mock.fn(() => response);
    response.send = send;
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(remove.mock.calls[0].arguments, [{ productId: 'product-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [204]);
    assert.equal(send.mock.callCount(), 1);
    assert.equal(json.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards deletion errors to the error handler', async (context) => {
    const failure = new Error('Database unavailable');
    const useCase = new DeleteProduct(createProductRepository({ deleteById: async () => { throw failure; } }));
    const controller = new DeleteProductController(useCase);
    const { response, status } = createResponse(context);
    const send = context.mock.fn(() => response);
    response.send = send;
    const next = context.mock.fn();

    await controller.execute({ params: { productId: 'product-1' } } as unknown as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(send.mock.callCount(), 0);
  });
});
