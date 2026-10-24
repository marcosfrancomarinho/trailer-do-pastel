import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { Table } from '../src/domain/entities/table.js';
import { TableNumber } from '../src/domain/value-objects/table/table-number.js';
import { PrismaTableRepository } from '../src/infrastructure/repositories/prisma-table-repository.js';

describe('PrismaTableRepository', () => {
  it('checks for an existing number and saves a table', async (context) => {
    const findFirst = context.mock.fn(async () => null);
    const create = context.mock.fn(async () => ({ id: 'table-id' }));
    const prisma = { table: { findFirst, create } } as unknown as PrismaClient;
    const repository = new PrismaTableRepository(prisma);

    assert.equal(await repository.existsByNumber(12), false);
    assert.deepEqual(findFirst.mock.calls[0].arguments, [{ where: { number: 12, deletedAt: null }, select: { id: true } }]);
    assert.equal(await repository.save(Table.create(TableNumber.create(12))), 'table-id');
    assert.deepEqual(create.mock.calls[0].arguments, [{
      data: { number: 12, status: 'FREE', totalSpent: '0' }, select: { id: true },
    }]);
  });

  it('reports a duplicate number when the database rejects a concurrent insert', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Duplicate table', {
      code: 'P2002', clientVersion: '6.19.3',
    });
    const prisma = { table: { create: async () => { throw prismaError; } } } as unknown as PrismaClient;

    await assert.rejects(
      new PrismaTableRepository(prisma).save(Table.create(TableNumber.create(12))),
      (error: unknown) => error instanceof ApplicationError && error.field === 'number' && error.code === 'ALREADY_EXISTS',
    );
  });

  it('opens a comanda when a table starts occupied', async (context) => {
    const create = context.mock.fn(async () => ({ id: 'table-id' }));
    const prisma = { table: { create } } as unknown as PrismaClient;
    const { TableStatus } = await import('../src/domain/value-objects/table/table-status.js');
    await new PrismaTableRepository(prisma).save(Table.create(TableNumber.create(12), TableStatus.create('OCCUPIED')));
    assert.deepEqual(create.mock.calls[0].arguments[0].data.sessions, { create: {} });
  });

  it('archives a free table without deleting its historical records', async (context) => {
    const updateMany = context.mock.fn(async () => ({ count: 1 }));
    const prisma = { table: { updateMany } } as unknown as PrismaClient;

    await new PrismaTableRepository(prisma).archive('table-id');

    const update = updateMany.mock.calls[0].arguments[0];
    assert.deepEqual(update.where, { id: 'table-id', deletedAt: null, status: 'FREE' });
    assert.ok(update.data.deletedAt instanceof Date);
  });

  it('rejects occupied and missing or previously archived tables', async () => {
    for (const scenario of [
      { table: { status: 'OCCUPIED', deletedAt: null }, code: 'IN_USE' },
      { table: { status: 'FREE', deletedAt: new Date() }, code: 'NOT_FOUND' },
      { table: null, code: 'NOT_FOUND' },
    ]) {
      const prisma = { table: {
        updateMany: async () => ({ count: 0 }),
        findUnique: async () => scenario.table,
      } } as unknown as PrismaClient;
      await assert.rejects(new PrismaTableRepository(prisma).archive('table-id'),
        (error: unknown) => error instanceof ApplicationError && error.field === 'tableId'
          && error.code === scenario.code);
    }
  });

  it('locks the table, checks active orders, and resets the current total in one transaction', async (context) => {
    const calls: string[] = [];
    const queryRaw = context.mock.fn(async (parts: TemplateStringsArray, id: string) => {
      calls.push('lock');
      assert.equal(id, 'table-id');
      assert.match(parts.join('?'), /FOR UPDATE/);
      return [{ id, status: 'OCCUPIED', total_spent: new Prisma.Decimal('25.5') }];
    });
    const count = context.mock.fn(async () => { calls.push('count'); return 0; });
    const findSession = context.mock.fn(async () => { calls.push('findSession'); return { id: 'session-1' }; });
    const closeSession = context.mock.fn(async () => { calls.push('closeSession'); return { id: 'session-1' }; });
    const update = context.mock.fn(async () => {
      calls.push('update');
      return { id: 'table-id', totalSpent: new Prisma.Decimal(0) };
    });
    const tx = { $queryRaw: queryRaw, order: { count }, tableSession: { findFirst: findSession, update: closeSession }, table: { update } };
    const transaction = context.mock.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx));
    const prisma = { $transaction: transaction } as unknown as PrismaClient;

    assert.deepEqual(await new PrismaTableRepository(prisma).release('table-id'), {
      id: 'table-id', status: 'FREE', totalSpent: '0', sessionId: 'session-1', closedTotal: '25.5',
    });
    assert.deepEqual(calls, ['lock', 'count', 'findSession', 'closeSession', 'update']);
    assert.deepEqual(findSession.mock.calls[0].arguments, [{
      where: { tableId: 'table-id', closedAt: null }, select: { id: true },
    }]);
    assert.equal(closeSession.mock.calls[0].arguments[0].data.closedTotal.toString(), '25.5');
    assert.deepEqual(count.mock.calls[0].arguments, [{
      where: { tableId: 'table-id', status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
    }]);
    assert.deepEqual(update.mock.calls[0].arguments, [{
      where: { id: 'table-id' }, data: { status: 'FREE', totalSpent: '0' },
      select: { id: true, totalSpent: true },
    }]);
  });

  it('rejects a missing, already free, or in-use table without resetting its total', async (context) => {
    const update = context.mock.fn(async () => ({ id: 'table-id', totalSpent: new Prisma.Decimal(0) }));
    for (const scenario of [
      { rows: [], activeOrders: 0, code: 'NOT_FOUND' },
      { rows: [{ id: 'table-id', status: 'FREE' }], activeOrders: 0, code: 'UNAVAILABLE' },
      { rows: [{ id: 'table-id', status: 'OCCUPIED' }], activeOrders: 1, code: 'IN_USE' },
    ]) {
      const tx = {
        $queryRaw: async () => scenario.rows,
        order: { count: async () => scenario.activeOrders },
        tableSession: { findFirst: async () => ({ id: 'session-1' }) },
        table: { update },
      };
      const prisma = {
        $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx),
      } as unknown as PrismaClient;
      await assert.rejects(
        new PrismaTableRepository(prisma).release('table-id'),
        (error: unknown) => error instanceof ApplicationError && error.field === 'tableId' && error.code === scenario.code,
      );
    }
    assert.equal(update.mock.callCount(), 0);
  });
});
