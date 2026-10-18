import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { OrderItemAddition } from '../src/domain/entities/order-item-addition.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { buildOrderAddition, buildOrderItem } from './helpers/order-fixtures.js';

describe('OrderItem', () => {
  it('calculates additions per product unit, then multiplies by the product quantity', () => {
    const addition = buildOrderAddition(2, '1.25');
    const item = buildOrderItem(3, '10.50', [addition]);

    assert.equal(addition.getAdditionId(), 'addition-1');
    assert.equal(addition.getQuantity(), 2);
    assert.equal(addition.getUnitPrice(), '1.25');
    assert.equal(addition.getTotal().getValue(), '2.5');
    assert.equal(item.getProductId(), 'product-1');
    assert.equal(item.getProductName(), 'Pastel de queijo');
    assert.equal(item.getQuantity(), 3);
    assert.equal(item.getUnitPrice(), '10.5');
    assert.equal(item.getTotal(), '39');
  });

  it('calculates a product without additions and preserves decimal precision', () => {
    assert.equal(buildOrderItem(3, '0.10').getTotal(), '0.3');
    assert.equal(buildOrderItem(3, '9007199254740993.01').getTotal(), '27021597764222979.03');
  });

  it('sums different additions and their quantities before multiplying by the product quantity', () => {
    const additions = [
      buildOrderAddition(2, '0.20', 'cheese'),
      buildOrderAddition(3, '0.35', 'olives'),
    ];
    const item = buildOrderItem(3, '0.10', additions);

    assert.equal(item.getTotal(), '4.65');
    assert.deepEqual(item.getAdditions(), additions);
  });

  it('keeps large totals exact when adding extras and multiplying quantities', () => {
    const item = buildOrderItem(2, '9007199254740993.01', [buildOrderAddition(3, '0.02')]);

    assert.equal(item.getTotal(), '18014398509481986.14');
  });

  it('rejects the same addition twice in one item', () => {
    assert.throws(
      () => buildOrderItem(1, '10', [buildOrderAddition(), buildOrderAddition()]),
      (error: unknown) => error instanceof DomainError && error.field === 'additions' && error.code === 'DUPLICATE',
    );
  });

  it('rejects invalid addition lists', () => {
    const cases = [
      { value: null, code: 'REQUIRED' },
      ...[{}, 'invalid', [null], [undefined], [{}], [[]], new Array(1)].map((value) => ({ value, code: 'INVALID_TYPE' })),
    ];
    for (const { value, code } of cases) {
      assert.throws(
        () => buildOrderItem(1, '10', value as OrderItemAddition[]),
        (error: unknown) => error instanceof DomainError && error.field === 'additions' && error.code === code,
      );
    }
  });

  it('keeps a snapshot of the additions and protects the list from mutation', () => {
    const additions = [buildOrderAddition()];
    const item = buildOrderItem(2, '10', additions);

    additions.length = 0;
    item.getAdditions().length = 0;
    item.getAdditions().push(buildOrderAddition(1, '1', 'another-addition'));

    assert.equal(item.getAdditions().length, 1);
    assert.equal(item.getTotal(), '25');
  });

  it('keeps additions separate when two items are created from the same source list', () => {
    const source = [buildOrderAddition(1, '0.50')];
    const first = buildOrderItem(1, '10', source);
    const second = buildOrderItem(2, '20', source);

    source.push(buildOrderAddition(1, '100', 'another-addition'));

    assert.equal(first.getTotal(), '10.5');
    assert.equal(second.getTotal(), '41');
    assert.equal(first.getAdditions().length, 1);
    assert.equal(second.getAdditions().length, 1);
  });
});
