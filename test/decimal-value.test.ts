import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DecimalValue } from '../src/domain/value-objects/shared/decimal-value.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';

describe('DecimalValue', () => {
  it('adds and multiplies values without binary rounding or losing significant digits', () => {
    const left = DecimalValue.create('0.1');
    assert.equal(left.add(DecimalValue.create('0.2')).getValue(), '0.3');
    assert.equal(left.multiply(DecimalValue.create('3')).getValue(), '0.3');
    assert.equal(left.getValue(), '0.1');
    assert.equal(
      DecimalValue.create('123456789012345678901234567890.01').add(DecimalValue.create('0.02')).getValue(),
      '1.2345678901234567890123456789003e+29',
    );
    assert.equal(
      DecimalValue.create('9007199254740993.01').multiply(DecimalValue.create('1000')).getValue(),
      '9007199254740993010',
    );
  });
  it('accepts a string and exposes its decimal representation', () => {
    const value = DecimalValue.create('12.50');

    assert.equal(value.getValue(), '12.5');
  });

  it('preserves digits that would be lost through a number conversion', () => {
    const value = '9007199254740993.01';
    assert.equal(DecimalValue.create(value).getValue(), value);
  });

  it('normalizes zero and preserves negative and positive decimals', () => {
    assert.equal(DecimalValue.create('0').getValue(), '0');
    assert.equal(DecimalValue.create('-0').getValue(), '0');
    assert.equal(DecimalValue.create('-0.01').getValue(), '-0.01');
    assert.equal(DecimalValue.create('0.01').getValue(), '0.01');
  });

  it('reports invalid inputs as domain errors in validation order', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'REQUIRED'], [null, 'REQUIRED'],
      [12.5, 'INVALID_TYPE'], [false, 'INVALID_TYPE'], [{}, 'INVALID_TYPE'],
      [NaN, 'INVALID_TYPE'], ['', 'EMPTY'], ['  ', 'EMPTY'],
      ['abc', 'INVALID_TYPE'], ['12,50', 'INVALID_TYPE'], ['NaN', 'INVALID_TYPE'],
      ['Infinity', 'NOT_FINITE'], ['-Infinity', 'NOT_FINITE'],
      [Infinity, 'INVALID_TYPE'], [-Infinity, 'INVALID_TYPE'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => DecimalValue.create(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'decimal' && error.code === code,
        `Expected ${code} for ${String(value)}`,
      );
    }
  });
});
