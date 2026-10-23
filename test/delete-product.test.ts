import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeleteProduct } from '../src/application/use-cases/products/delete-product.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createProductRepository } from './helpers/order-fixtures.js';

describe('DeleteProduct', () => {
  it('deletes the product using the normalized ID', async (context) => {
    const deleteById = context.mock.fn(async () => {});
    const useCase = new DeleteProduct(createProductRepository({ deleteById }));

    await useCase.delete({ productId: ' product-1 ' });

    assert.deepEqual(deleteById.mock.calls[0].arguments, ['product-1']);
  });

  it('rejects an invalid ID before accessing the repository', async (context) => {
    const deleteById = context.mock.fn(async () => {});
    const useCase = new DeleteProduct(createProductRepository({ deleteById }));

    await assert.rejects(
      useCase.delete({ productId: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'productId',
    );
    assert.equal(deleteById.mock.callCount(), 0);
  });
});
