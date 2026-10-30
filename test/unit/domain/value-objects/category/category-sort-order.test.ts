import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import { CategorySortOrder } from '../../../../../src/domain/value-objects/category/category-sort-order.js';

describe('CategorySortOrder', () => {
  it('accepts non-negative safe integers', () => {
    assert.equal(CategorySortOrder.create(0).getValue(), 0);
    assert.equal(CategorySortOrder.create(3).getValue(), 3);
    assert.equal(CategorySortOrder.create(2147483647).getValue(), 2147483647);
  });

  it('calculates the next category position', () => {
    assert.equal(CategorySortOrder.nextAfter(null).getValue(), 1);
    assert.equal(CategorySortOrder.nextAfter(3).getValue(), 4);
    assert.throws(
      () => CategorySortOrder.nextAfter(2147483647),
      (error: unknown) => error instanceof DomainError
        && error.field === 'sortOrder' && error.code === 'TOO_LARGE',
    );
    assert.throws(
      () => CategorySortOrder.nextAfter(-1),
      (error: unknown) => error instanceof DomainError
        && error.field === 'sortOrder' && error.code === 'NEGATIVE',
    );
  });

  it('rejects invalid positions', () => {
    const cases: Array<{ value: unknown; code: string }> = [
      { value: undefined, code: 'REQUIRED' },
      { value: null, code: 'REQUIRED' },
      { value: '2', code: 'INVALID_TYPE' },
      { value: NaN, code: 'INVALID_TYPE' },
      { value: Infinity, code: 'NOT_FINITE' },
      { value: -Infinity, code: 'NOT_FINITE' },
      { value: 1.5, code: 'INVALID_INTEGER' },
      { value: -1, code: 'NEGATIVE' },
      { value: 2147483648, code: 'TOO_LARGE' },
    ];

    for (const { value, code } of cases) {
      assert.throws(
        () => CategorySortOrder.create(value),
        (error: unknown) => error instanceof DomainError
          && error.field === 'sortOrder' && error.code === code,
      );
    }
  });
});
