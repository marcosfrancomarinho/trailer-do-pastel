import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaOrderQueries } from '../src/infrastructure/queries/prisma-order-queries.js';

describe('PrismaOrderQueries table sessions', () => {
  it('returns only orders of the open comanda with its current total', async (context) => {
    const findUnique = context.mock.fn(async () => ({
      id: 'table-1', number: 1, status: 'OCCUPIED', totalSpent: new Prisma.Decimal('25.50'),
      sessions: [{ id: 'session-current', orders: [
        {
          id: 'order-1', customerName: 'Maria', customerPhone: '11999999999', observation: null, tableId: 'table-1',
          status: 'PENDING', total: new Prisma.Decimal('10.00'),
          createdAt: new Date('2026-10-23T10:00:00Z'), updatedAt: new Date('2026-10-23T10:00:00Z'),
          items: [{ productId: 'product-1', productName: 'Pastel', quantity: 1,
            unitPrice: new Prisma.Decimal('10'), additions: [] }],
        },
        {
          id: 'order-2', customerName: 'João', customerPhone: '11988888888', observation: 'Sem cebola', tableId: 'table-1',
          status: 'COMPLETED', total: new Prisma.Decimal('15.50'),
          createdAt: new Date('2026-10-23T11:00:00Z'), updatedAt: new Date('2026-10-23T11:30:00Z'),
          items: [{ productId: 'product-2', productName: 'Pastel especial', quantity: 1,
            unitPrice: new Prisma.Decimal('13'), additions: [{ additionId: 'addition-1', quantity: 1,
              unitPrice: new Prisma.Decimal('2.50'), addition: { name: 'Queijo extra' } }] }],
        },
      ] }],
    }));
    const prisma = { table: { findUnique } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaOrderQueries(prisma).findByTableId('table-1'), {
      tableId: 'table-1', number: 1, status: 'OCCUPIED', totalSpent: '25.5', sessionId: 'session-current',
      orders: [
        { id: 'order-1', createdBy: null, customerName: 'Maria', customerPhone: '11999999999', observation: null,
          tableId: 'table-1', status: 'PENDING', total: '10',
          createdAt: '2026-10-23T10:00:00.000Z', updatedAt: '2026-10-23T10:00:00.000Z',
          items: [{ productId: 'product-1', productName: 'Pastel', quantity: 1, unitPrice: '10', additions: [] }] },
        { id: 'order-2', createdBy: null, customerName: 'João', customerPhone: '11988888888', observation: 'Sem cebola',
          tableId: 'table-1', status: 'COMPLETED', total: '15.5',
          createdAt: '2026-10-23T11:00:00.000Z', updatedAt: '2026-10-23T11:30:00.000Z',
          items: [{ productId: 'product-2', productName: 'Pastel especial', quantity: 1, unitPrice: '13',
            additions: [{ additionId: 'addition-1', additionName: 'Queijo extra', quantity: 1, unitPrice: '2.5' }] }] },
      ],
    });
    assert.equal(findUnique.mock.calls[0].arguments[0].where.id, 'table-1');
    assert.deepEqual(findUnique.mock.calls[0].arguments[0].select.sessions.select.orders.orderBy,
      [{ createdAt: 'asc' }, { id: 'asc' }]);
    assert.deepEqual(findUnique.mock.calls[0].arguments[0].select.sessions.where, { closedAt: null });
    assert.deepEqual(findUnique.mock.calls[0].arguments[0].select.sessions.select.orders.where,
      { tableId: 'table-1', status: { not: 'CANCELED' } });
  });

  it('returns an existing table with no orders and null for an unknown table', async () => {
    const emptyTable = { id: 'table-1', number: 1, status: 'FREE', totalSpent: new Prisma.Decimal('0'), sessions: [] };
    const prisma = { table: { findUnique: async ({ where }: { where: { id: string } }) =>
      where.id === 'table-1' ? emptyTable : null } } as unknown as PrismaClient;
    const queries = new PrismaOrderQueries(prisma);

    assert.deepEqual(await queries.findByTableId('table-1'), {
      tableId: 'table-1', number: 1, status: 'FREE', totalSpent: '0', sessionId: null, orders: [],
    });
    assert.equal(await queries.findByTableId('missing'), null);
  });

  it('returns previous comandas with their orders and closed totals', async (context) => {
    const findUnique = context.mock.fn(async () => ({
      id: 'table-1', sessions: [{
        id: 'session-old', openedAt: new Date('2026-10-22T10:00:00Z'),
        closedAt: new Date('2026-10-22T11:00:00Z'), closedTotal: new Prisma.Decimal('30'),
        orders: [{
          id: 'order-old', customerName: 'Maria', customerPhone: '11999999999', observation: null,
          tableId: 'table-1', status: 'COMPLETED', total: new Prisma.Decimal('30'),
          createdAt: new Date('2026-10-22T10:05:00Z'), updatedAt: new Date('2026-10-22T10:30:00Z'), items: [],
        }],
      }],
    }));
    const prisma = { table: { findUnique } } as unknown as PrismaClient;
    assert.deepEqual(await new PrismaOrderQueries(prisma).findSessionsByTableId('table-1'), {
      tableId: 'table-1', sessions: [{
        id: 'session-old', openedAt: '2026-10-22T10:00:00.000Z',
        closedAt: '2026-10-22T11:00:00.000Z', closedTotal: '30',
        orders: [{
          id: 'order-old', createdBy: null, customerName: 'Maria', customerPhone: '11999999999', observation: null,
          tableId: 'table-1', status: 'COMPLETED', total: '30',
          createdAt: '2026-10-22T10:05:00.000Z', updatedAt: '2026-10-22T10:30:00.000Z', items: [],
        }],
      }],
    });
    assert.deepEqual(findUnique.mock.calls[0].arguments[0].select.sessions.orderBy,
      [{ openedAt: 'desc' }, { id: 'desc' }]);
  });
  it('merges finalized online orders with closed table sessions without duplicating removed table orders', async (context) => {
    const findSessions = context.mock.fn(async () => [{
      id: 'session-1', tableId: 'table-1', table: { number: 4 },
      openedAt: new Date('2026-10-24T12:00:00Z'), closedAt: new Date('2026-10-24T13:00:00Z'),
      closedTotal: new Prisma.Decimal('20'), orders: [],
    }]);
    const findOnline = context.mock.fn(async () => [{
      id: 'online-1', customerName: 'Ana', customerPhone: '11999999999',
      observation: null, tableId: null, status: 'COMPLETED',
      total: new Prisma.Decimal('15'), createdAt: new Date('2026-10-24T14:00:00Z'),
      updatedAt: new Date('2026-10-24T14:30:00Z'), items: [],
    }]);
    const prisma = { tableSession: { findMany: findSessions }, order: { findMany: findOnline } } as unknown as PrismaClient;
    const results = await new PrismaOrderQueries(prisma).findClosedSessions('2026-10-24');
    assert.equal(results.length, 2);
    assert.equal(results[0].origin, 'ONLINE');
    assert.equal(results[0].tableNumber, null);
    assert.equal(results[0].session.closedTotal, '15');
    assert.equal(results[0].session.orders[0].id, 'online-1');
    assert.equal(results[1].origin, 'TABLE');
    assert.equal(results[1].tableNumber, 4);
    assert.deepEqual(findOnline.mock.calls[0].arguments[0].where, {
      tableId: null, tableSessionId: null, status: { in: ['COMPLETED', 'CANCELED'] },
      updatedAt: { gte: new Date('2026-10-24T03:00:00.000Z'), lt: new Date('2026-10-25T03:00:00.000Z') },
    });
  });

});
