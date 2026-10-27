import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma } from '@prisma/client';
import { OrderItemMap } from '../src/infrastructure/map/order-item-map.js';
import { TableOrderMap } from '../src/infrastructure/map/table-order-map.js';

describe('OrderItemMap', () => {
  it('maps product snapshots and additions to JSON-safe decimals', () => {
    const items = [{
      productId: 'product-1', productName: 'Pastel de queijo', quantity: 2,
      unitPrice: new Prisma.Decimal('12.50'),
      additions: [{ additionId: 'addition-1', quantity: 1, unitPrice: new Prisma.Decimal('2.50'),
        addition: { name: 'Queijo extra' } }],
    }];

    assert.deepEqual(OrderItemMap.map(items), [{
      productId: 'product-1', productName: 'Pastel de queijo', quantity: 2,
      unitPrice: '12.5', additions: [{ additionId: 'addition-1', additionName: 'Queijo extra',
        quantity: 1, unitPrice: '2.5' }],
    }]);
    assert.deepEqual(OrderItemMap.map([]), []);
  });
});

describe('TableOrderMap', () => {
  const order = {
    id: 'order-1', customerName: 'Maria', customerPhone: '11999999999',
    user: { name: 'Ana', role: 'EMPLOYEE' as const }, observation: 'Sem cebola',
    tableId: 'table-1', status: 'COMPLETED' as const, total: new Prisma.Decimal('30'),
    createdAt: new Date('2026-10-24T12:00:00Z'), updatedAt: new Date('2026-10-24T12:30:00Z'),
    items: [{ productId: 'product-1', productName: 'Pastel', quantity: 2,
      unitPrice: new Prisma.Decimal('15'), additions: [] }],
  };

  it('maps the employee, items, timestamps and total', () => {
    assert.deepEqual(TableOrderMap.map(order), {
      id: 'order-1', customerName: 'Maria', customerPhone: '11999999999',
      createdBy: { name: 'Ana', role: 'EMPLOYEE' }, observation: 'Sem cebola',
      tableId: 'table-1', status: 'COMPLETED', total: '30',
      createdAt: '2026-10-24T12:00:00.000Z', updatedAt: '2026-10-24T12:30:00.000Z',
      items: [{ productId: 'product-1', productName: 'Pastel', quantity: 2,
        unitPrice: '15', additions: [] }],
    });
  });

  it('returns null when the creator has been deleted', () => {
    assert.equal(TableOrderMap.map({ ...order, user: null }).createdBy, null);
  });
});
