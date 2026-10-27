import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListCategories } from '../../../../src/application/use-cases/categories/list-categories.js';
import { ListAdditions } from '../../../../src/application/use-cases/additions/list-additions.js';
import type { CategoryListItem } from '../../../../src/application/dtos/categories/list-categories-dto.js';
import type { AdditionListItem } from '../../../../src/application/dtos/additions/list-additions-dto.js';

describe('Catalog listing use cases', () => {
  for (const result of [[], [{ id: 'category-1', name: 'Pasteis' }]] satisfies CategoryListItem[][]) {
    it(`returns ${result.length} categories without changing query results`, async (context) => {
      const findAll = context.mock.fn(async () => result);
      assert.strictEqual(await new ListCategories({ findAll }).list(), result);
      assert.equal(findAll.mock.callCount(), 1);
      assert.deepEqual(findAll.mock.calls[0].arguments, []);
    });
  }
  for (const result of [[], [{ id: 'addition-1', name: 'Queijo extra', price: '0.1', available: false }]] satisfies AdditionListItem[][]) {
    it(`returns ${result.length} additions preserving unavailable entries and prices`, async (context) => {
      const findAll = context.mock.fn(async () => result);
      assert.strictEqual(await new ListAdditions({ findAll, findByProductId: async () => [] }).list(), result);
      assert.equal(findAll.mock.callCount(), 1);
      assert.deepEqual(findAll.mock.calls[0].arguments, []);
    });
  }
  it('preserves query errors for categories and additions', async () => {
    const failure = new Error('Database unavailable');
    const findAll = async () => { throw failure; };
    for (const useCase of [new ListCategories({ findAll }), new ListAdditions({ findAll, findByProductId: async () => [] })]) {
      await assert.rejects(useCase.list(), (error: unknown) => error === failure);
    }
  });
});
