import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { ReferenceId } from '../src/domain/value-objects/shared/reference-id.js';

describe('ReferenceId', () => {
  it('normalizes a valid reference identifier', () => {
    assert.equal(ReferenceId.create(' product-1 ', 'productId').getValue(), 'product-1');
  });

  it('reports the reference field when the identifier is missing, incorrectly typed or empty', () => {
    for (const value of [null, undefined, 123, false, {}, '', ' ']) {
      assert.throws(
        () => ReferenceId.create(value as string, 'additionId'),
        (error: unknown) => error instanceof DomainError && error.field === 'additionId',
      );
    }
  });
});
