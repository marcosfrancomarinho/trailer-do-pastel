import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { UpdateCategory } from '../../../../../../src/application/use-cases/categories/update-category.js';
import { UpdateCategoryController } from '../../../../../../src/infrastructure/http/controllers/categories/update-category-controller.js';
import { createCategoryRepository } from '../../../../../helpers/order-fixtures.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('UpdateCategoryController', () => {
  it('takes the ID from the route and responds with the updated ID', async (context) => {
    const useCase = new UpdateCategory(createCategoryRepository());
    const update = context.mock.method(useCase, 'update', async () => ({ id: 'category-1' }));
    const controller = new UpdateCategoryController(useCase);
    const request = {
      params: { categoryId: 'category-1' },
      body: { name: 'Pastéis', id: 'ignored' },
    } as unknown as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(update.mock.calls[0].arguments, [{ name: 'Pastéis', categoryId: 'category-1' }]);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [{ id: 'category-1' }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards errors without writing a response', async (context) => {
    const failure = new Error('Database unavailable');
    const useCase = new UpdateCategory(createCategoryRepository({ update: async () => { throw failure; } }));
    const controller = new UpdateCategoryController(useCase);
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({
      params: { categoryId: 'category-1' },
      body: { name: 'Pastéis' },
    } as unknown as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
