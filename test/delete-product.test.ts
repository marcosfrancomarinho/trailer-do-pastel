import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DeleteProduct } from '../src/application/use-cases/products/delete-product.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createProductRepository } from './helpers/order-fixtures.js';

describe('DeleteProduct', () => {
  it('deletes the product using the normalized ID', async (context) => {
    const calls: string[] = [];
    const existsById = context.mock.fn(async (_id: string) => {
      calls.push('exists');
      return true;
    });
    const deleteById = context.mock.fn(async (_id: string) => {
      calls.push('delete');
    });
    const useCase = new DeleteProduct(createProductRepository({ existsById, deleteById }));

    await useCase.delete({ productId: ' product-1 ' });

    assert.deepEqual(existsById.mock.calls[0].arguments, ['product-1']);
    assert.deepEqual(deleteById.mock.calls[0].arguments, ['product-1']);
    assert.deepEqual(calls, ['exists', 'delete']);
  });

  it('rejects an invalid ID before accessing the repository', async (context) => {
    const existsById = context.mock.fn(async (_id: string) => true);
    const deleteById = context.mock.fn(async () => {});
    const useCase = new DeleteProduct(createProductRepository({ existsById, deleteById }));

    await assert.rejects(
      useCase.delete({ productId: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'productId',
    );
    assert.equal(existsById.mock.callCount(), 0);
    assert.equal(deleteById.mock.callCount(), 0);
  });

  it('rejects an unknown product before deleting', async (context) => {
    const existsById = context.mock.fn(async (_id: string) => false);
    const deleteById = context.mock.fn(async (_id: string) => {});
    const useCase = new DeleteProduct(createProductRepository({ existsById, deleteById }));

    await assert.rejects(
      useCase.delete({ productId: 'missing' }),
      (error: unknown) => error instanceof ApplicationError
        && error.field === 'productId'
        && error.code === 'NOT_FOUND',
    );

    assert.deepEqual(existsById.mock.calls[0].arguments, ['missing']);
    assert.equal(deleteById.mock.callCount(), 0);
  });
});
