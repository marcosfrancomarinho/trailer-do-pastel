import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Addition } from '../src/domain/entities/addition.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { DecimalValue } from '../src/domain/value-objects/shared/decimal-value.js';
import { AdditionCreatedAt } from '../src/domain/value-objects/addition/addition-created-at.js';
import { AdditionName } from '../src/domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../src/domain/value-objects/addition/addition-price.js';

function createAddition(available?: boolean, id?: string): Addition {
  return Addition.create(
    AdditionName.create(' Queijo extra '),
    AdditionPrice.create(DecimalValue.create('12.50')),
    AdditionCreatedAt.create(),
    available,
    id,
  );
}

describe('Addition', () => {
  it('exposes validated values and the persisted ID while preserving unavailable status', (context) => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    context.mock.method(Date, 'now', () => now);
    const addition = createAddition(false, 'database-id');

    assert.equal(addition.getId(), 'database-id');
    assert.equal(addition.getName(), 'Queijo extra');
    assert.equal(addition.getPrice().getValue(), '12.5');
    assert.equal(addition.isAvailable(), false);
    assert.equal(addition.getCreatedAt().getTime(), now);
  });

  it('defaults to available and throws a domain error when an ID has not been assigned', () => {
    const addition = createAddition();

    assert.equal(addition.isAvailable(), true);
    assert.throws(() => addition.getId(), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.name, 'DomainError');
      assert.equal(error.field, 'id');
      assert.equal(error.code, 'REQUIRED');
      assert.equal(error.message, 'O adicional ainda não possui um ID.');
      return true;
    });
  });

  it('does not allow changes to its creation date through the getter', () => {
    const addition = createAddition();
    const timestamp = addition.getCreatedAt().getTime();

    addition.getCreatedAt().setTime(0);

    assert.equal(addition.getCreatedAt().getTime(), timestamp);
  });
});
