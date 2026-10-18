import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UserCreatedAt } from '../src/domain/value-objects/user/user-created-at.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';

describe('UserCreatedAt', () => {
  const now = new Date('2026-10-18T12:00:00Z').getTime();

  it('rejects dates before the current instant', (context) => {
    context.mock.method(Date, 'now', () => now);

    assert.throws(
      () => UserCreatedAt.create(new Date(now - 1)),
      (error: unknown) => error instanceof DomainError && error.code === 'PAST_DATE' && error.field === 'createdAt',
    );
  });

  it('accepts the current instant and future dates', (context) => {
    context.mock.method(Date, 'now', () => now);

    for (const timestamp of [now, now + 1]) {
      assert.equal(UserCreatedAt.create(new Date(timestamp)).getValue().getTime(), timestamp);
    }
  });

  it('uses the same clock reading to create and validate the default date', (context) => {
    let clock = now;
    context.mock.method(Date, 'now', () => clock++);

    assert.equal(UserCreatedAt.create().getValue().getTime(), now);
    assert.equal(clock, now + 1);
    assert.equal(UserCreatedAt.create(undefined).getValue().getTime(), now + 1);
    assert.equal(clock, now + 2);
  });

  it('validates missing values, type and validity before checking the past', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [null, 'REQUIRED'],
      ['2026-10-18', 'INVALID_TYPE'], [new Date('invalid'), 'INVALID_DATE'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => UserCreatedAt.create(value as Date),
        (error: unknown) => error instanceof DomainError && error.code === code,
      );
    }
  });

  it('protects the stored timestamp from changes to the input and returned dates', (context) => {
    context.mock.method(Date, 'now', () => now);
    const date = new Date(now);
    const createdAt = UserCreatedAt.create(date);

    date.setTime(0);
    createdAt.getValue().setTime(0);

    assert.equal(createdAt.getValue().getTime(), now);
  });
});
