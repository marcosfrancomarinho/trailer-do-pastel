import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrderStatus } from '../../../../../src/domain/value-objects/order/order-status.js';

describe('OrderStatus business rules', () => {
  for (const status of ['PENDING', 'CONFIRMED', 'PREPARING']) {
    it(`allows changing an active ${status} order`, () => {
      assert.equal(OrderStatus.create(status).canChangeStatus(), true);
    });
    it(`allows removing a ${status} order from its table`, () => {
      assert.equal(OrderStatus.create(status).canBeRemovedFromTable(), true);
    });
  }

  for (const status of ['COMPLETED', 'CANCELED']) {
    it(`prevents changing a terminal ${status} order`, () => {
      assert.equal(OrderStatus.create(status).canChangeStatus(), false);
    });
    it(`prevents removing a ${status} order from its table`, () => {
      assert.equal(OrderStatus.create(status).canBeRemovedFromTable(), false);
    });
  }

  it('exposes only active statuses for conditional persistence and active-order queries', () => {
    assert.deepEqual(OrderStatus.getActiveStatuses(), ['PENDING', 'CONFIRMED', 'PREPARING']);
  });

  it('protects the business rules from mutations to a returned status list', () => {
    const statuses = OrderStatus.getActiveStatuses();
    statuses.splice(0, statuses.length, 'COMPLETED', 'CANCELED');
    assert.deepEqual(OrderStatus.getActiveStatuses(), ['PENDING', 'CONFIRMED', 'PREPARING']);
    assert.equal(OrderStatus.create('COMPLETED').canChangeStatus(), false);
    assert.equal(OrderStatus.create('PENDING').canBeRemovedFromTable(), true);
  });
});
