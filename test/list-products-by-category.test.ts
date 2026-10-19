import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListProductsByCategory } from '../src/application/use-cases/products/list-products-by-category.js';
import { DomainError } from '../src/domain/errors/domain-error.js';

describe('ListProductsByCategory', () => {
  it('queries products with the normalized category ID and returns the read DTO', async (context) => {
    const products = [{
      id: 'product-1',
      name: 'Pastel de queijo',
      description: 'Queijo e orégano',
      categoryId: 'category-1',
      price: '12.50',
      available: true,
    }];
    const findByCategoryId = context.mock.fn(async (categoryId: string) => {
      assert.equal(categoryId, 'category-1');
      return products;
    });
    const useCase = new ListProductsByCategory({ findAll: async () => [], findByCategoryId });

    assert.deepEqual(await useCase.list({ categoryId: ' category-1 ' }), products);
    assert.equal(findByCategoryId.mock.callCount(), 1);
  });

  it('rejects an invalid category ID before querying', async (context) => {
    const findByCategoryId = context.mock.fn(async () => []);
    const useCase = new ListProductsByCategory({ findAll: async () => [], findByCategoryId });

    for (const categoryId of [undefined, null, '', ' ', 123]) {
      await assert.rejects(
        useCase.list({ categoryId: categoryId as string }),
        (error: unknown) => error instanceof DomainError && error.field === 'categoryId',
      );
    }

    assert.equal(findByCategoryId.mock.callCount(), 0);
  });
});
