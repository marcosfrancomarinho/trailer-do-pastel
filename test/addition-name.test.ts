import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';
import { AdditionName } from '../src/domain/value-objects/addition/addition-name.js';

describe('AdditionName', () => {
  it('removes surrounding whitespace while preserving the addition name', () => {
    assert.equal(AdditionName.create(' \tQueijo Extra\n').getValue(), 'Queijo Extra');
  });

  it('rejects missing values, invalid types and empty names with specific errors', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'REQUIRED'], [null, 'REQUIRED'],
      [123, 'INVALID_TYPE'], [false, 'INVALID_TYPE'], [{}, 'INVALID_TYPE'],
      ['', 'EMPTY'], [' \t\n', 'EMPTY'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => AdditionName.create(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'name' && error.code === code,
        `Expected ${code} for ${String(value)}`,
      );
    }
  });
});
