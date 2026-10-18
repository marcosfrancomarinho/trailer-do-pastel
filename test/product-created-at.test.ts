import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ProductCreatedAt } from '../src/domain/value-objects/product/product-created-at.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { DomainErrorCode } from '../src/domain/errors/domain-error.js';

describe('ProductCreatedAt', () => {
  it('restores a persisted past date while still rejecting it for a new product', (context) => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    context.mock.method(Date, 'now', () => now);
    const date = new Date('2026-01-01T12:00:00Z');
    const restored = ProductCreatedAt.restore(date);

    assert.equal(restored.getValue().getTime(), date.getTime());
    assert.throws(() => ProductCreatedAt.create(date), (error: unknown) => error instanceof DomainError && error.code === 'PAST_DATE');
    date.setTime(0);
    assert.equal(restored.getValue().toISOString(), '2026-01-01T12:00:00.000Z');
  });

  it('validates the presence, type and validity of persisted dates', () => {
    for (const value of [undefined, null, '2026-01-01', new Date('invalid')]) {
      assert.throws(() => ProductCreatedAt.restore(value as Date), DomainError);
    }
  });

  const now = new Date('2026-10-18T12:00:00Z').getTime();

  it('rejects dates before the current instant', (context) => {
    context.mock.method(Date, 'now', () => now);

    assert.throws(
      () => ProductCreatedAt.create(new Date(now - 1)),
      (error: unknown) => error instanceof DomainError && error.code === 'PAST_DATE' && error.field === 'createdAt',
    );
  });

  it('accepts the current instant and future dates', (context) => {
    context.mock.method(Date, 'now', () => now);

    for (const timestamp of [now, now + 1]) {
      assert.equal(ProductCreatedAt.create(new Date(timestamp)).getValue().getTime(), timestamp);
    }
  });

  it('uses the same clock reading to create and validate the default date', (context) => {
    let clock = now;
    context.mock.method(Date, 'now', () => clock++);

    assert.equal(ProductCreatedAt.create().getValue().getTime(), now);
    assert.equal(clock, now + 1);
    assert.equal(ProductCreatedAt.create(undefined).getValue().getTime(), now + 1);
    assert.equal(clock, now + 2);
  });

  it('validates missing values, type and validity before checking the past', () => {
    const cases: [unknown, DomainErrorCode][] = [
      [null, 'REQUIRED'],
      ['2026-10-18', 'INVALID_TYPE'], [new Date('invalid'), 'INVALID_DATE'],
    ];

    for (const [value, code] of cases) {
      assert.throws(
        () => ProductCreatedAt.create(value as Date),
        (error: unknown) => error instanceof DomainError && error.code === code,
      );
    }
  });

  it('protects the stored timestamp from changes to the input and returned dates', (context) => {
    context.mock.method(Date, 'now', () => now);
    const date = new Date(now);
    const createdAt = ProductCreatedAt.create(date);

    date.setTime(0);
    createdAt.getValue().setTime(0);

    assert.equal(createdAt.getValue().getTime(), now);
  });
});
