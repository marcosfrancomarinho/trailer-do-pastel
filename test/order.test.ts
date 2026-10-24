import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { OrderItem } from '../src/domain/entities/order-item.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { buildOrder, buildOrderAddition, buildOrderItem } from './helpers/order-fixtures.js';

describe('Order', () => {
  it('starts as pending and calculates the total from all item snapshots', () => {
    const order = buildOrder([buildOrderItem(2, '10', [buildOrderAddition()]), buildOrderItem(3, '12.5')], 'order-id');

    assert.equal(order.getId(), 'order-id');
    assert.equal(order.getCustomerName(), 'Marcos');
    assert.equal(order.getCustomerPhone(), '11999999999');
    assert.equal(order.getObservation(), null);
    assert.equal(order.getStatus(), 'PENDING');
    assert.equal(order.getTotal(), '62.5');
  });

  it('creates an order without a user account and rejects access to an unassigned ID', () => {
    const order = buildOrder();
    assert.equal('userId' in order, false);
    assert.throws(
      () => order.getId(),
      (error: unknown) => error instanceof DomainError && error.field === 'id' && error.code === 'REQUIRED',
    );
  });

  it('sums item totals without rounding large values or small additions', () => {
    const items = [
      buildOrderItem(1, '9007199254740993.01'),
      buildOrderItem(3, '0.02'),
    ];
    const order = buildOrder(items);

    assert.equal(order.getTotal(), '9007199254740993.07');
  });

  it('requires a nonempty list of valid order items', () => {
    for (const value of [null, [], {}, [null], [{}], new Array(1)]) {
      assert.throws(() => buildOrder(value as OrderItem[]), DomainError);
    }
  });

  it('protects its item list from mutation', () => {
    const items = [buildOrderItem(2)];
    const order = buildOrder(items);

    items.length = 0;
    (order.getItems() as OrderItem[]).length = 0;
    order.getItems().push(buildOrderItem());

    assert.equal(order.getItems().length, 1);
    assert.equal(order.getTotal(), '20');
  });
});
