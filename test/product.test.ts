import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Product } from '../src/domain/entities/product.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { DecimalValue } from '../src/domain/value-objects/shared/decimal-value.js';
import { ProductDescription } from '../src/domain/value-objects/product/product-description.js';
import { ProductName } from '../src/domain/value-objects/product/product-name.js';
import { ProductPrice } from '../src/domain/value-objects/product/product-price.js';
import { ReferenceId } from '../src/domain/value-objects/shared/reference-id.js';

function createProduct(available?: boolean, id?: string): Product {
  return Product.create(
    ProductName.create(' Pastel de queijo '),
    ProductPrice.create(DecimalValue.create('12.50')),
    ProductDescription.create('Queijo e orégano'),
    ReferenceId.create('category-id', 'categoryId'),
    available,
    null,
    id,
  );
}

describe('Product', () => {
  it('exposes the linked category ID', () => {
    const product = Product.create(
      ProductName.create('Pastel de queijo'),
      ProductPrice.create(DecimalValue.create('12.50')),
      ProductDescription.create('Queijo e orégano'),
      ReferenceId.create('category-id', 'categoryId'),
      true,
      null,
      'database-id',
    );

    assert.equal(product.getCategoryId(), 'category-id');
  });

  it('exposes validated values and the persisted ID while preserving unavailable status', () => {
    const product = createProduct(false, 'database-id');

    assert.equal(product.getId(), 'database-id');
    assert.equal(product.getName(), 'Pastel de queijo');
    assert.equal(product.getDescription(), 'Queijo e orégano');
    assert.equal(product.getPrice(), '12.5');
    assert.equal(product.getImageUrl(), null);
    assert.equal(product.isAvailable(), false);
  });

  it('defaults to available and throws a domain error when an ID has not been assigned', () => {
    const product = createProduct();

    assert.equal(product.isAvailable(), true);
    assert.throws(() => product.getId(), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.name, 'DomainError');
      assert.equal(error.field, 'id');
      assert.equal(error.code, 'REQUIRED');
      assert.equal(error.message, 'O produto ainda não possui um ID.');
      return true;
    });
  });
});
