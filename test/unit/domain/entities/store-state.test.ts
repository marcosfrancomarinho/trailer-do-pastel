import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StoreState } from '../../../../src/domain/entities/store-state.js';
import { DomainError } from '../../../../src/domain/errors/domain-error.js';

describe('StoreState', () => {
  it('recognizes open and closed states', () => {
    assert.equal(StoreState.create('OPEN', new Date('2026-10-29T12:00:00.000Z')).isClosed(), false);
    assert.equal(StoreState.create('CLOSED', new Date('2026-10-29T12:00:00.000Z')).isClosed(), true);
  });

  for (const [status, code] of [
    [undefined, 'REQUIRED'],
    [null, 'REQUIRED'],
    [1, 'INVALID_TYPE'],
    ['PAUSED', 'INVALID_FORMAT'],
  ] as const) {
    it(`rejects ${String(status)} with ${code}`, () => {
      assert.throws(
        () => StoreState.create(status, new Date('2026-10-29T12:00:00.000Z')),
        (error: unknown) => error instanceof DomainError && error.field === 'status' && error.code === code,
      );
    });
  }

  it('rejects an invalid update date', () => {
    assert.throws(
      () => StoreState.create('OPEN', new Date('invalid')),
      (error: unknown) => error instanceof DomainError && error.field === 'updatedAt' && error.code === 'INVALID_DATE',
    );
  });
});
