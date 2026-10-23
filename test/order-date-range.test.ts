import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrderDateRange } from '../src/domain/value-objects/order/order-date-range.js';
import { DomainError } from '../src/domain/errors/domain-error.js';

describe('OrderDateRange', () => {
  it('uses the current date in Imperatriz when date is omitted', () => {
    assert.deepEqual(OrderDateRange.create(undefined, new Date('2026-10-23T02:30:00.000Z')).getValue(), {
      start: new Date('2026-10-22T03:00:00.000Z'),
      end: new Date('2026-10-23T03:00:00.000Z'),
    });
  });

  it('uses an inclusive start and an exclusive next-day boundary', () => {
    assert.deepEqual(OrderDateRange.create('2026-10-22').getValue(), {
      start: new Date('2026-10-22T03:00:00.000Z'),
      end: new Date('2026-10-23T03:00:00.000Z'),
    });
  });

  it('supports leap days', () => {
    assert.equal(OrderDateRange.create('2028-02-29').getValue().start.toISOString(), '2028-02-29T03:00:00.000Z');
  });

  it('does not allow callers to change its interval through returned dates', () => {
    const range = OrderDateRange.create('2026-10-22');
    const value = range.getValue();
    value.start.setUTCDate(1);
    value.end.setUTCDate(1);

    assert.deepEqual(range.getValue(), {
      start: new Date('2026-10-22T03:00:00.000Z'),
      end: new Date('2026-10-23T03:00:00.000Z'),
    });
  });

  it('rejects invalid dates', () => {
    for (const value of ['2026-02-29', '2026-13-01', '2026-04-31', '22/10/2026', '', ['2026-10-22']]) {
      assert.throws(() => OrderDateRange.create(value), DomainError);
    }
  });
});
