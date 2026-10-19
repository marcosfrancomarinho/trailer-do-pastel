import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { User } from '../src/domain/entities/user.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';
import { UserPassword } from '../src/domain/value-objects/user/user-password.js';
import { UserCreatedAt } from '../src/domain/value-objects/user/user-created-at.js';
import { UserName } from '../src/domain/value-objects/user/user-name.js';

function createUser(id?: string): User {
  return User.create(
    UserName.create(' Marcos '),
    UserPassword.create('SenhaDeTeste123'),
    UserCreatedAt.create(),
    id,
  );
}

describe('User', () => {
  it('exposes the normalized name, validated password, creation date and persisted ID', (context) => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    context.mock.method(Date, 'now', () => now);
    const user = createUser('database-id');

    assert.equal(user.getId(), 'database-id');
    assert.equal(user.getName(), 'Marcos');
    assert.equal(user.getPassword(), 'SenhaDeTeste123');
    assert.equal(user.getCreatedAt().getTime(), now);
  });

  it('replaces the password with the hash without changing the remaining user data', () => {
    const user = createUser('database-id');
    const createdAt = user.getCreatedAt().getTime();

    user.defineEncryptedPassword('$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

    assert.equal(user.getPassword(), '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    assert.equal(user.getId(), 'database-id');
    assert.equal(user.getName(), 'Marcos');
    assert.equal(user.getCreatedAt().getTime(), createdAt);
  });

  it('rejects invalid hashed passwords and preserves the previous password', () => {
    const user = createUser();
    const cases: [unknown, DomainErrorCode][] = [
      [undefined, 'INVALID_HASH'], [null, 'INVALID_HASH'],
      [123, 'INVALID_HASH'], [false, 'INVALID_HASH'], [{}, 'INVALID_HASH'],
      ['', 'INVALID_HASH'], [' \t\n', 'INVALID_HASH'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => user.defineEncryptedPassword(value as string),
        (error: unknown) => error instanceof DomainError && error.field === 'password' && error.code === code,
      );
      assert.equal(user.getPassword(), 'SenhaDeTeste123');
    }
  });

  it('throws a domain error when an ID has not been assigned', () => {
    const user = createUser();
    assert.throws(
      () => user.getId(),
      (error: unknown) => error instanceof DomainError && error.field === 'id' && error.code === 'REQUIRED',
    );
  });

  it('protects the stored creation date from mutation', () => {
    const user = createUser();
    const timestamp = user.getCreatedAt().getTime();
    user.getCreatedAt().setTime(0);
    assert.equal(user.getCreatedAt().getTime(), timestamp);
  });
});
