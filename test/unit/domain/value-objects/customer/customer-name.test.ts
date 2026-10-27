import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../../../../../src/domain/errors/domain-error.js';
import { CustomerName } from '../../../../../src/domain/value-objects/customer/customer-name.js';

describe('CustomerName', () => {
  it('removes surrounding whitespace while preserving the customer name', () => {
    assert.equal(CustomerName.create(' \tMarcos Franco\n').getValue(), 'Marcos Franco');
  });

  it('rejects missing values, invalid types and empty names with specific errors', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'REQUIRED'], [null, 'REQUIRED'],
      [123, 'INVALID_TYPE'], [false, 'INVALID_TYPE'], [{}, 'INVALID_TYPE'],
      ['', 'EMPTY'], [' \t\n', 'EMPTY'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => CustomerName.create(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'customerName' && error.code === code,
        `Expected ${code} for ${String(value)}`,
      );
    }
  });
});
