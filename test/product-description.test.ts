import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';
import { ProductDescription } from '../src/domain/value-objects/product/product-description.js';

describe('ProductDescription', () => {
  it('preserves a valid description', () => {
    const description = 'Queijo, tomate e orégano.\nPreparado na hora.';
    assert.equal(ProductDescription.create(description).getValue(), description);
  });

  it('rejects missing values, non-text descriptions and blank text', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'REQUIRED'], [null, 'INVALID_TYPE'],
      [123, 'INVALID_TYPE'], [false, 'INVALID_TYPE'], [{}, 'INVALID_TYPE'],
      ['', 'EMPTY'], [' \t\n', 'EMPTY'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => ProductDescription.create(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'description' && error.code === code,
        `Expected ${code} for ${String(value)}`,
      );
    }
  });
});
