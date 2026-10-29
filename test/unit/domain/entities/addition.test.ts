import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Addition } from '../../../../src/domain/entities/addition.js';
import { DomainError } from '../../../../src/domain/errors/domain-error.js';
import { DecimalValue } from '../../../../src/domain/value-objects/shared/decimal-value.js';
import { AdditionName } from '../../../../src/domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../../../../src/domain/value-objects/addition/addition-price.js';

function createAddition(available?: boolean, id?: string): Addition {
  return Addition.create(
    AdditionName.create(' Queijo extra '),
    AdditionPrice.create(DecimalValue.create('12.50')),
    available,
    id,
  );
}

describe('Addition', () => {
  it('compares names using their validated values', () => {
    const addition: Addition = createAddition();

    assert.equal(addition.hasDifferentName(AdditionName.create(' Queijo extra ')), false);
    assert.equal(addition.hasDifferentName(AdditionName.create('Bacon extra')), true);
  });

  it('rejects non-boolean availability', () => {
    const invalidValues: unknown[] = [null, 'true', 'false', 0, 1, {}, []];

    for (const available of invalidValues) {
      assert.throws(() => createAddition(available as boolean), (error: unknown) =>
        error instanceof DomainError && error.field === 'available' && error.code === 'INVALID_TYPE');
    }
  });

  it('exposes validated values and the persisted ID while preserving unavailable status', () => {
    const addition = createAddition(false, 'database-id');

    assert.equal(addition.getId(), 'database-id');
    assert.equal(addition.getName(), 'Queijo extra');
    assert.equal(addition.getPrice(), '12.5');
    assert.equal(addition.isAvailable(), false);
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
});
