import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildOrderAddition } from '../../../helpers/order-fixtures.js';

describe('OrderItemAddition', () => {
  it('preserves the addition ID, quantity and decimal unit price', () => {
    const addition = buildOrderAddition(3, '1.2500', 'cheese');
    const unitPrice = addition.getUnitPrice();
    const total = addition.getTotal();

    assert.equal(addition.getAdditionId(), 'cheese');
    assert.equal(addition.getQuantity(), 3);
    assert.equal(unitPrice, '1.25');
    assert.equal(total, '3.75');
  });

  it('multiplies fractional and large prices without losing precision', () => {
    const cases = [
      { price: '0.1', quantity: 3, expected: '0.3' },
      { price: '9007199254740993.01', quantity: 3, expected: '27021597764222979.03' },
    ];

    for (const { price, quantity, expected } of cases) {
      const addition = buildOrderAddition(quantity, price);
      const total = addition.getTotal();
      const unitPrice = addition.getUnitPrice();

      assert.equal(total, expected);
      assert.equal(unitPrice, price);
      assert.equal(addition.getQuantity(), quantity);
    }
  });
});
