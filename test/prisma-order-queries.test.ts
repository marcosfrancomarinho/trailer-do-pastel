import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaOrderQueries } from '../src/infrastructure/queries/prisma-order-queries.js';

describe('PrismaOrderQueries', () => {
  it('returns the current status by tracking token without customer details', async (context) => {
    const findUnique = context.mock.fn(async () => ({
      status: 'READY',
      updatedAt: new Date('2026-10-22T12:00:00.000Z'),
    }));
    const prisma = { order: { findUnique } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaOrderQueries(prisma).findByTrackingToken('token-1'), {
      status: 'READY',
      updatedAt: '2026-10-22T12:00:00.000Z',
    });
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { trackingToken: 'token-1' },
      select: { status: true, updatedAt: true },
    }]);
  });

  it('returns null when the tracking token is unknown', async () => {
    const prisma = { order: { findUnique: async () => null } } as unknown as PrismaClient;

    assert.equal(await new PrismaOrderQueries(prisma).findByTrackingToken('unknown'), null);
  });

  it('returns only pending orders with item details, ordered oldest first', async (context) => {
    const findMany = context.mock.fn(async () => [{
      id: 'order-1',
      customerName: 'Maria Silva',
      customerPhone: '11999999999',
      status: 'PENDING',
      total: new Prisma.Decimal('9007199254740993.01'),
      createdAt: new Date('2026-10-19T10:00:00.000Z'),
      items: [{
        productId: 'product-1',
        productName: 'Pastel de queijo',
        quantity: 2,
        unitPrice: new Prisma.Decimal('12.50'),
        additions: [{
          additionId: 'addition-1',
          quantity: 1,
          unitPrice: new Prisma.Decimal('2.50'),
          addition: { name: 'Queijo extra' },
        }],
      }],
    }]);
    const prisma = { order: { findMany } } as unknown as PrismaClient;

    const result = await new PrismaOrderQueries(prisma).findPending();

    assert.deepEqual(result, [{
      id: 'order-1',
      customerName: 'Maria Silva',
      customerPhone: '11999999999',
      status: 'PENDING',
      total: '9007199254740993.01',
      createdAt: '2026-10-19T10:00:00.000Z',
      items: [{
        productId: 'product-1',
        productName: 'Pastel de queijo',
        quantity: 2,
        unitPrice: '12.5',
        additions: [{ additionId: 'addition-1', additionName: 'Queijo extra', quantity: 1, unitPrice: '2.5' }],
      }],
    }]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      where: { status: 'PENDING' },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            additions: {
              select: {
                additionId: true,
                quantity: true,
                unitPrice: true,
                addition: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }]);
  });

  it('returns an empty list when there are no pending orders', async () => {
    const prisma = { order: { findMany: async () => [] } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaOrderQueries(prisma).findPending(), []);
  });

  it('returns completed and canceled orders with items and chronological status changes', async (context) => {
    const findMany = context.mock.fn(async () => [{
      id: 'order-2',
      customerName: 'Ana Souza',
      customerPhone: '11988888888',
      status: 'CANCELED',
      total: new Prisma.Decimal('15.50'),
      createdAt: new Date('2026-10-20T10:00:00.000Z'),
      updatedAt: new Date('2026-10-20T10:05:00.000Z'),
      items: [{
        productId: 'product-1',
        productName: 'Pastel de queijo',
        quantity: 1,
        unitPrice: new Prisma.Decimal('12.50'),
        additions: [{
          additionId: 'addition-1',
          quantity: 1,
          unitPrice: new Prisma.Decimal('3.00'),
          addition: { name: 'Queijo extra' },
        }],
      }],
      histories: [
        { status: 'PENDING', changedAt: new Date('2026-10-20T10:00:00.000Z') },
        { status: 'CANCELED', changedAt: new Date('2026-10-20T10:05:00.000Z') },
      ],
    }]);
    const prisma = { order: { findMany } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaOrderQueries(prisma).findHistory(), [{
      id: 'order-2',
      customerName: 'Ana Souza',
      customerPhone: '11988888888',
      status: 'CANCELED',
      total: '15.5',
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-20T10:05:00.000Z',
      items: [{
        productId: 'product-1',
        productName: 'Pastel de queijo',
        quantity: 1,
        unitPrice: '12.5',
        additions: [{ additionId: 'addition-1', additionName: 'Queijo extra', quantity: 1, unitPrice: '3' }],
      }],
      histories: [
        { status: 'PENDING', changedAt: '2026-10-20T10:00:00.000Z' },
        { status: 'CANCELED', changedAt: '2026-10-20T10:05:00.000Z' },
      ],
    }]);
    assert.deepEqual(findMany.mock.calls[0].arguments, [{
      where: { status: { in: ['COMPLETED', 'CANCELED'] } },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            additions: {
              select: {
                additionId: true,
                quantity: true,
                unitPrice: true,
                addition: { select: { name: true } },
              },
            },
          },
        },
        histories: {
          select: { status: true, changedAt: true },
          orderBy: [{ changedAt: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    }]);
  });

  it('returns an empty history when no order is completed or canceled', async () => {
    const prisma = { order: { findMany: async () => [] } } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaOrderQueries(prisma).findHistory(), []);
  });
});
