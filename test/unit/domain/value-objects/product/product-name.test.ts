import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../../../../../src/domain/errors/domain-error.js';
import { ProductName } from '../../../../../src/domain/value-objects/product/product-name.js';

describe('ProductName', () => {
  it('removes surrounding whitespace while preserving the product name', () => {
    assert.equal(ProductName.create(' \tPastel de Queijo\n').getValue(), 'Pastel de Queijo');
  });

  it('rejects missing values, invalid types and empty names with specific errors', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'REQUIRED'], [null, 'REQUIRED'],
      [123, 'INVALID_TYPE'], [false, 'INVALID_TYPE'], [{}, 'INVALID_TYPE'],
      ['', 'EMPTY'], [' \t\n', 'EMPTY'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => ProductName.create(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'name' && error.code === code,
        `Expected ${code} for ${String(value)}`,
      );
    }
  });
});
