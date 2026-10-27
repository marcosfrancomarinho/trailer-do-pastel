import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../../../../src/domain/errors/domain-error.js';
import { CategoryName } from '../../../../src/domain/value-objects/category/category-name.js';
import { OrderObservation } from '../../../../src/domain/value-objects/order/order-observation.js';
import { OrderStatus } from '../../../../src/domain/value-objects/order/order-status.js';
import { ProductImageUrl } from '../../../../src/domain/value-objects/product/product-image-url.js';
import { TableNumber } from '../../../../src/domain/value-objects/table/table-number.js';
import { TableStatus } from '../../../../src/domain/value-objects/table/table-status.js';

function rejectsWithCode(action: () => unknown, field: string, code: string): void {
  assert.throws(action, (error: unknown) =>
    error instanceof DomainError && error.field === field && error.code === code);
}

describe('CategoryName', () => {
  it('trims a valid name', () => assert.equal(CategoryName.create('  Pastéis  ').getValue(), 'Pastéis'));
  it('rejects missing, non-text and blank names', () => {
    rejectsWithCode(() => CategoryName.create(undefined as never), 'name', 'REQUIRED');
    rejectsWithCode(() => CategoryName.create(12 as never), 'name', 'INVALID_TYPE');
    rejectsWithCode(() => CategoryName.create('  '), 'name', 'EMPTY');
  });
});

describe('ProductImageUrl', () => {
  it('accepts trimmed HTTP and HTTPS URLs', () => {
    assert.equal(ProductImageUrl.create(' https://example.com/pastel.png ').getValue(), 'https://example.com/pastel.png');
    assert.equal(ProductImageUrl.create('http://example.com/pastel.png').getValue(), 'http://example.com/pastel.png');
  });
  it('rejects non-text, malformed and non-HTTP URLs', () => {
    rejectsWithCode(() => ProductImageUrl.create(1 as never), 'imageUrl', 'INVALID_TYPE');
    rejectsWithCode(() => ProductImageUrl.create('invalid'), 'imageUrl', 'INVALID_FORMAT');
    rejectsWithCode(() => ProductImageUrl.create('file:///tmp/pastel.png'), 'imageUrl', 'INVALID_FORMAT');
  });
});

describe('TableNumber', () => {
  it('accepts a positive integer in the database range', () => {
    assert.equal(TableNumber.create(1).getValue(), 1);
    assert.equal(TableNumber.create(2147483647).getValue(), 2147483647);
  });
  it('rejects invalid numbers with distinct validation codes', () => {
    for (const [value, code] of [
      [null, 'REQUIRED'], ['12', 'INVALID_TYPE'], [Number.NaN, 'INVALID_TYPE'],
      [Infinity, 'NOT_FINITE'], [1.5, 'INVALID_INTEGER'], [0, 'NON_POSITIVE'],
      [2147483648, 'TOO_LARGE'],
    ] as const) rejectsWithCode(() => TableNumber.create(value), 'number', code);
  });
});

describe('TableStatus and OrderStatus', () => {
  it('accepts each public status', () => {
    for (const status of ['FREE', 'OCCUPIED']) assert.equal(TableStatus.create(status).getValue(), status);
    for (const status of ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELED']) {
      assert.equal(OrderStatus.create(status).getValue(), status);
    }
  });
  it('rejects missing, wrong-type and unknown statuses', () => {
    for (const create of [TableStatus.create, OrderStatus.create] as const) {
      rejectsWithCode(() => create(undefined as never), 'status', 'REQUIRED');
      rejectsWithCode(() => create(1 as never), 'status', 'INVALID_TYPE');
      rejectsWithCode(() => create('READY'), 'status', 'INVALID_FORMAT');
    }
  });
});

describe('OrderObservation', () => {
  it('normalizes missing and whitespace-only observations to null', () => {
    for (const value of [undefined, null, '   ']) assert.equal(OrderObservation.create(value).getValue(), null);
  });
  it('trims text and accepts the length limit', () => {
    assert.equal(OrderObservation.create(' sem cebola ').getValue(), 'sem cebola');
    assert.equal(OrderObservation.create('x'.repeat(500)).getValue()?.length, 500);
  });
  it('rejects non-text and text above the limit', () => {
    rejectsWithCode(() => OrderObservation.create(1), 'observation', 'INVALID_TYPE');
    rejectsWithCode(() => OrderObservation.create('x'.repeat(501)), 'observation', 'TOO_LONG');
  });
});
