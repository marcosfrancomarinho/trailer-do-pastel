import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListProducts } from '../src/application/use-cases/products/list-products.js';

describe('ListProducts', () => {
  it('returns products from different categories including unavailable products', async (context) => {
    const products = [
      {
        id: 'product-1',
        name: 'Pastel de queijo',
        description: 'Queijo e orégano',
        categoryId: 'category-1',
        price: '12.5',
        available: true,
      },
      {
        id: 'product-2',
        name: 'Suco de laranja',
        description: 'Suco natural',
        categoryId: 'category-2',
        price: '8',
        available: false,
      },
    ];
    const findAll = context.mock.fn(async () => products);
    const findByCategoryId = context.mock.fn(async () => []);
    const useCase = new ListProducts({ findAll, findByCategoryId });

    assert.deepEqual(await useCase.list(), products);
    assert.equal(findAll.mock.callCount(), 1);
    assert.deepEqual(findAll.mock.calls[0].arguments, []);
    assert.equal(findByCategoryId.mock.callCount(), 0);
  });

  it('returns an empty list when there are no products', async () => {
    const useCase = new ListProducts({
      findAll: async () => [],
      findByCategoryId: async () => [],
    });

    assert.deepEqual(await useCase.list(), []);
  });

  it('propagates query failures', async () => {
    const error = new Error('Database unavailable');
    const useCase = new ListProducts({
      findAll: async () => { throw error; },
      findByCategoryId: async () => [],
    });

    await assert.rejects(useCase.list(), (caught: unknown) => caught === error);
  });
});
