import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListAdditionsByProduct } from '../src/application/use-cases/additions/list-additions-by-product.js';
import { DomainError } from '../src/domain/errors/domain-error.js';

describe('ListAdditionsByProduct', () => {
  it('queries additions using the normalized product ID', async (context) => {
    const additions = [{ id: 'addition-1', name: 'Queijo extra', price: '2.5', available: true }];
    const findByProductId = context.mock.fn(async (productId: string) => {
      assert.equal(productId, 'product-1');
      return additions;
    });
    const useCase = new ListAdditionsByProduct({ findAll: async () => [], findByProductId });

    assert.deepEqual(await useCase.list({ productId: ' product-1 ' }), additions);
    assert.equal(findByProductId.mock.callCount(), 1);
  });

  it('rejects an invalid product ID before querying', async (context) => {
    const findByProductId = context.mock.fn(async () => []);
    const useCase = new ListAdditionsByProduct({ findAll: async () => [], findByProductId });

    for (const productId of [undefined, null, '', ' ', 123]) {
      await assert.rejects(
        useCase.list({ productId: productId as string }),
        (error: unknown) => error instanceof DomainError && error.field === 'productId',
      );
    }

    assert.equal(findByProductId.mock.callCount(), 0);
  });
});
