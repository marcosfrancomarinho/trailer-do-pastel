import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';
import { CustomerPhone } from '../src/domain/value-objects/customer/customer-phone.js';

describe('CustomerPhone', () => {
  it('normalizes local and international phone formatting', () => {
    assert.equal(CustomerPhone.create('(11) 99999-9999').getValue(), '11999999999');
    assert.equal(CustomerPhone.create(' +55 (11) 99999-9999 ').getValue(), '+5511999999999');
    assert.equal(CustomerPhone.create('1133334444').getValue(), '1133334444');
  });

  it('rejects missing values, invalid types, blank values and invalid phone formats', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [null, 'REQUIRED'], [undefined, 'REQUIRED'], [11999999999, 'INVALID_TYPE'], [false, 'INVALID_TYPE'],
      ['', 'EMPTY'], [' ', 'EMPTY'], ['123', 'INVALID_FORMAT'], ['1'.repeat(16), 'INVALID_FORMAT'],
      ['1199999abcd', 'INVALID_FORMAT'], ['++5511999999999', 'INVALID_FORMAT'],
    ];
    for (const [value, code] of cases) {
      assert.throws(
        () => CustomerPhone.create(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'customerPhone' && error.code === code,
      );
    }
  });
});
