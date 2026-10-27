import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../../../../../src/domain/errors/domain-error.js';
import { OrderQuantity } from '../../../../../src/domain/value-objects/order/order-quantity.js';

describe('OrderQuantity', () => {
  it('accepts positive integers supported by the database', () => {
    for (const value of [1, 10, 2147483647]) assert.equal(OrderQuantity.create(value).getValue(), value);
  });

  it('rejects missing, incorrectly typed, fractional, non-positive and oversized quantities', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [null, 'REQUIRED'], [undefined, 'REQUIRED'], ['1', 'INVALID_TYPE'], [false, 'INVALID_TYPE'],
      [NaN, 'INVALID_TYPE'], [Infinity, 'NOT_FINITE'], [-Infinity, 'NOT_FINITE'],
      [1.1, 'INVALID_INTEGER'], [0, 'NON_POSITIVE'], [-1, 'NON_POSITIVE'], [2147483648, 'TOO_LARGE'],
    ];
    for (const [value, code] of cases) {
      assert.throws(
        () => OrderQuantity.create(value as number),
        (error: unknown) => error instanceof DomainError && error.field === 'quantity' && error.code === code,
      );
    }
  });
});
