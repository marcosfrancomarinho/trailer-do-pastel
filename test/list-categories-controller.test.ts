import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListCategories } from '../src/application/use-cases/categories/list-categories.js';
import { ListCategoriesController } from '../src/infrastructure/http/controllers/categories/list-categories-controller.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('ListCategoriesController', () => {
  it('returns all categories with status 200', async (context) => {
    const categories = [{ id: 'category-1', name: 'Bebidas' }, { id: 'category-2', name: 'Pastéis' }];
    const findAll = context.mock.fn(async () => categories);
    const controller = new ListCategoriesController(new ListCategories({ findAll }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.equal(findAll.mock.callCount(), 1);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [categories]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('returns an empty list with status 200', async (context) => {
    const controller = new ListCategoriesController(new ListCategories({ findAll: async () => [] }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [[]]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards query failures without writing a response', async (context) => {
    const failure = new Error('Database unavailable');
    const controller = new ListCategoriesController(new ListCategories({ findAll: async () => { throw failure; } }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({} as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, [failure]);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
