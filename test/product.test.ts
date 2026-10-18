import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Product } from '../src/domain/entities/product.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { DecimalValue } from '../src/domain/value-objects/shared/decimal-value.js';
import { ProductCreatedAt } from '../src/domain/value-objects/product/product-created-at.js';
import { ProductDescription } from '../src/domain/value-objects/product/product-description.js';
import { ProductName } from '../src/domain/value-objects/product/product-name.js';
import { ProductPrice } from '../src/domain/value-objects/product/product-price.js';

function createProduct(available?: boolean, id?: string): Product {
  return Product.create(
    ProductName.create(' Pastel de queijo '),
    ProductPrice.create(DecimalValue.create('12.50')),
    ProductDescription.create('Queijo e orégano'),
    ProductCreatedAt.create(),
    available,
    id,
  );
}

describe('Product', () => {
  it('supports an absent persisted description', () => {
    const product = Product.create(
      ProductName.create('Pastel de queijo'),
      ProductPrice.create(DecimalValue.create('12.50')),
      null,
      ProductCreatedAt.create(),
      true,
      'database-id',
    );

    assert.equal(product.getDescription(), null);
    assert.equal(product.getId(), 'database-id');
  });

  it('exposes validated values and the persisted ID while preserving unavailable status', (context) => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    context.mock.method(Date, 'now', () => now);
    const product = createProduct(false, 'database-id');

    assert.equal(product.getId(), 'database-id');
    assert.equal(product.getName(), 'Pastel de queijo');
    assert.equal(product.getDescription(), 'Queijo e orégano');
    assert.equal(product.getPrice().getValue(), '12.5');
    assert.equal(product.isAvailable(), false);
    assert.equal(product.getCreatedAt().getTime(), now);
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

  it('does not allow changes to its creation date through the getter', () => {
    const product = createProduct();
    const timestamp = product.getCreatedAt().getTime();

    product.getCreatedAt().setTime(0);

    assert.equal(product.getCreatedAt().getTime(), timestamp);
  });
});
