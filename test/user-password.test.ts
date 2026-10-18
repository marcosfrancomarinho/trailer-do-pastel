import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UserPassword } from '../src/domain/value-objects/user/user-password.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';

describe('UserPassword', () => {
  it('preserves the exact password, including surrounding spaces', () => {
    const password = '  Senha de teste1!  ';
    assert.equal(UserPassword.create(password).getValue(), password);
  });

  it('accepts passwords up to 72 UTF-8 bytes', () => {
    for (const password of ['a'.repeat(71) + '1', 'á'.repeat(35) + 'a1', '🔐'.repeat(17) + 'a123']) {
      assert.equal(UserPassword.create(password).getValue(), password);
    }
  });

  it('accepts eight characters with letters and numbers, including accented letters', () => {
    for (const password of ['Abcdefg1', 'ábcdefg1', '1234567a']) {
      assert.equal(UserPassword.create(password).getValue(), password);
    }
  });

  it('rejects invalid values and passwords exceeding the byte limit', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'REQUIRED'], [null, 'REQUIRED'],
      [123, 'INVALID_TYPE'], [false, 'INVALID_TYPE'], [{}, 'INVALID_TYPE'],
      ['', 'EMPTY'], [' \t\n', 'EMPTY'],
      ['Abcdef1', 'TOO_SHORT'], ['🔐🔐🔐a123', 'TOO_SHORT'],
      ['abcdefgh', 'MISSING_NUMBER'], ['12345678', 'MISSING_LETTER'],
      ['!!!!!!!!', 'MISSING_LETTER'], ['🔐'.repeat(8), 'MISSING_LETTER'],
      ['a'.repeat(72) + '1', 'TOO_LONG'], ['á'.repeat(36) + '1', 'TOO_LONG'], ['🔐'.repeat(18) + 'a1', 'TOO_LONG'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => UserPassword.create(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'password' && error.code === code,
        `Expected ${code}`,
      );
    }
  });
});
