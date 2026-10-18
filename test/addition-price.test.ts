import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DecimalValue } from '../src/domain/value-objects/shared/decimal-value.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';
import { AdditionPrice } from '../src/domain/value-objects/addition/addition-price.js';

describe('AdditionPrice', () => {
  it('accepts positive prices through DecimalValue', () => {
    for (const value of ['0.01', '1e-1000', '1e+1000']) {
      const price = AdditionPrice.create(DecimalValue.create(value));
      assert.equal(price.getValue().getValue(), value);
    }
  });

  it('rejects missing, incorrectly typed and non-positive prices with domain errors', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'REQUIRED'], [null, 'REQUIRED'],
      ['', 'INVALID_TYPE'], ['12.50', 'INVALID_TYPE'],
      [12.5, 'INVALID_TYPE'], [false, 'INVALID_TYPE'], [{}, 'INVALID_TYPE'],
      [NaN, 'INVALID_TYPE'],
      [DecimalValue.create('0'), 'NON_POSITIVE'],
      [DecimalValue.create('-0'), 'NON_POSITIVE'],
      [DecimalValue.create('-0.01'), 'NON_POSITIVE'],
      [DecimalValue.create('-1e-1000'), 'NON_POSITIVE'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => AdditionPrice.create(value as DecimalValue),
        (error: unknown) => error instanceof DomainError && error.field === 'price' && error.code === code,
        `Expected ${code} for ${String(value)}`,
      );
    }
  });
});
