import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { orderDateRange } from '../src/application/dtos/orders/order-date-range.js';
import { DomainError } from '../src/domain/errors/domain-error.js';

describe('orderDateRange', () => {
  it('uses the current date in Imperatriz when date is omitted', () => {
    assert.deepEqual(orderDateRange(undefined, new Date('2026-10-23T02:30:00.000Z')), {
      start: new Date('2026-10-22T03:00:00.000Z'),
      end: new Date('2026-10-23T03:00:00.000Z'),
    });
  });

  it('uses an inclusive start and an exclusive next-day boundary', () => {
    assert.deepEqual(orderDateRange('2026-10-22'), {
      start: new Date('2026-10-22T03:00:00.000Z'),
      end: new Date('2026-10-23T03:00:00.000Z'),
    });
  });

  it('supports leap days', () => {
    assert.equal(orderDateRange('2028-02-29').start.toISOString(), '2028-02-29T03:00:00.000Z');
  });

  it('rejects invalid dates', () => {
    for (const value of ['2026-02-29', '2026-13-01', '2026-04-31', '22/10/2026', '', ['2026-10-22']]) {
      assert.throws(() => orderDateRange(value), DomainError);
    }
  });
});
