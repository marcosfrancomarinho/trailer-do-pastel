import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { DeleteCategory } from '../../../../../../src/application/use-cases/categories/delete-category.js';
import { DeleteCategoryController } from '../../../../../../src/infrastructure/http/controllers/categories/delete-category-controller.js';
import { createCategoryRepository } from '../../../../../helpers/order-fixtures.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('DeleteCategoryController', () => {
  it('takes the category ID from the route and responds with 204', async (context) => {
    const useCase = new DeleteCategory(createCategoryRepository());
    const remove = context.mock.method(useCase, 'delete');
    const controller = new DeleteCategoryController(useCase);
    const request = { params: { categoryId: 'category-1' } } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const send = context.mock.fn(() => response);
    response.send = send;
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(remove.mock.calls[0].arguments, [{ categoryId: 'category-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [204]);
    assert.equal(send.mock.callCount(), 1);
    assert.equal(json.mock.callCount(), 0);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards deletion errors to the error handler', async (context) => {
    const failure = new Error('Database unavailable');
    const useCase = new DeleteCategory(createCategoryRepository({ deleteById: async () => { throw failure; } }));
    const controller = new DeleteCategoryController(useCase);
    const { response, status } = createResponse(context);
    const send = context.mock.fn(() => response);
    response.send = send;
    const next = context.mock.fn();

    await controller.execute({ params: { categoryId: 'category-1' } } as unknown as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(send.mock.callCount(), 0);
  });
});
