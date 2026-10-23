import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UpdateProduct } from '../src/application/use-cases/products/update-product.js';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createAdditionRepository, createCategoryRepository, createProductRepository } from './helpers/order-fixtures.js';

describe('UpdateProduct', () => {
  it('updates only the supplied fields and keeps existing addition links when omitted', async (context) => {
    const update = context.mock.fn(async (product, additions) => {
      assert.equal(product.getId(), 'product-1');
      assert.equal(product.getName(), 'Pastel de queijo');
      assert.equal(product.getDescription(), 'Preparado na hora');
      assert.equal(product.getCategoryId(), 'category-1');
      assert.equal(product.getPrice(), '14.5');
      assert.equal(product.getImageUrl(), null);
      assert.equal(product.isAvailable(), true);
      assert.equal(additions, undefined);
    });
    const useCase = new UpdateProduct(
      createProductRepository({ update }),
      createAdditionRepository(),
      createCategoryRepository(),
    );

    assert.deepEqual(await useCase.update({ productId: ' product-1 ', price: '14.50' }), { id: 'product-1' });
    assert.equal(update.mock.callCount(), 1);
  });

  it('updates and clears the image URL without changing other fields', async (context) => {
    const update = context.mock.fn(async () => {});
    const useCase = new UpdateProduct(
      createProductRepository({ update }),
      createAdditionRepository(),
      createCategoryRepository(),
    );

    await useCase.update({ productId: 'product-1', imageUrl: ' https://example.com/new.jpg ' });
    await useCase.update({ productId: 'product-1', imageUrl: null });

    assert.equal(update.mock.calls[0].arguments[0].getImageUrl(), 'https://example.com/new.jpg');
    assert.equal(update.mock.calls[1].arguments[0].getImageUrl(), null);
    assert.equal(update.mock.calls[0].arguments[0].getPrice(), '10');
  });

  it('replaces additions when IDs are supplied and removes all when the list is empty', async (context) => {
    const update = context.mock.fn(async () => {});
    const useCase = new UpdateProduct(
      createProductRepository({ update }),
      createAdditionRepository(),
      createCategoryRepository(),
    );

    await useCase.update({ productId: 'product-1', additionIds: [' addition-1 ', 'addition-2'] });
    await useCase.update({ productId: 'product-1', additionIds: [] });

    assert.deepEqual(update.mock.calls[0].arguments[1].map((addition) => addition.getId()), ['addition-1', 'addition-2']);
    assert.deepEqual(update.mock.calls[1].arguments[1], []);
  });

  it('rejects missing products and invalid or empty changes before writing', async (context) => {
    const update = context.mock.fn(async () => {});
    const useCase = new UpdateProduct(
      createProductRepository({ update }),
      createAdditionRepository(),
      createCategoryRepository(),
    );

    await assert.rejects(useCase.update({ productId: 'missing', price: '10' }), (error: unknown) =>
      error instanceof ApplicationError && error.field === 'productId' && error.code === 'NOT_FOUND');

    for (const input of [
      { productId: 'product-1' },
      { productId: 'product-1', price: '0' },
      { productId: 'product-1', available: null as unknown as boolean },
      { productId: 'product-1', imageUrl: 'ftp://example.com/pastel.jpg' },
      { productId: 'product-1', additionIds: ['addition-1', ' addition-1 '] },
    ]) {
      await assert.rejects(useCase.update(input), DomainError);
    }
    assert.equal(update.mock.callCount(), 0);
  });

  it('validates category, additions, and a changed name', async (context) => {
    const update = context.mock.fn(async () => {});
    const useCase = new UpdateProduct(
      createProductRepository({ update, existsByName: async () => true }),
      createAdditionRepository(),
      createCategoryRepository(),
    );

    for (const [input, field, code] of [
      [{ productId: 'product-1', categoryId: 'missing' }, 'categoryId', 'NOT_FOUND'],
      [{ productId: 'product-1', additionIds: ['missing'] }, 'additionIds', 'NOT_FOUND'],
      [{ productId: 'product-1', name: 'Outro pastel' }, 'name', 'ALREADY_EXISTS'],
    ] as const) {
      await assert.rejects(useCase.update(input), (error: unknown) =>
        error instanceof ApplicationError && error.field === field && error.code === code);
    }
    assert.equal(update.mock.callCount(), 0);
  });
});
