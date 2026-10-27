import { EventObserver } from '../../../../../src/application/observer/event-observer.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateTable } from '../../../../../src/application/use-cases/tables/create-table.js';
import { ApplicationError } from '../../../../../src/application/errors/application-error.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';

describe('CreateTable', () => {
  it('saves a valid table and returns its ID', async () => {
    const calls: string[] = [];
    const useCase = new CreateTable({
      async existsByNumber(number) {
        calls.push('lookup');
        assert.equal(number, 12);
        return false;
      },
      async save(table) {
        calls.push('save');
        assert.equal(table.getNumber(), 12);
        assert.equal(table.getStatus(), 'FREE');
        assert.equal(table.getTotalSpent(), '0');
        return 'table-id';
      },
    }, new EventObserver());

    assert.deepEqual(await useCase.create({ number: 12 }), { id: 'table-id', status: 'FREE', totalSpent: '0' });
    assert.deepEqual(calls, ['lookup', 'save']);
  });

  it('accepts an occupied status at creation', async () => {
    const useCase = new CreateTable({
      existsByNumber: async () => false,
      async save(table) {
        assert.equal(table.getStatus(), 'OCCUPIED');
        return 'table-id';
      },
    }, new EventObserver());

    assert.deepEqual(await useCase.create({ number: 12, status: 'OCCUPIED' }), {
      id: 'table-id', status: 'OCCUPIED', totalSpent: '0',
    }, new EventObserver());
  });

  it('rejects missing, invalid, and nonpositive numbers before accessing the repository', async (context) => {
    const existsByNumber = context.mock.fn(async () => false);
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateTable({ existsByNumber, save });

    for (const number of [undefined, null, '1', 0, -1, 1.5, Infinity, 2147483648]) {
      await assert.rejects(
        useCase.create({ number: number as number }),
        (error: unknown) => error instanceof DomainError && error.field === 'number',
      );
    }
    assert.equal(existsByNumber.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('does not save a duplicate table number', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateTable({ existsByNumber: async () => true, save });

    await assert.rejects(
      useCase.create({ number: 12 }),
      (error: unknown) => error instanceof ApplicationError && error.field === 'number' && error.code === 'ALREADY_EXISTS',
    );
    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects invalid statuses before accessing the repository', async (context) => {
    const existsByNumber = context.mock.fn(async () => false);
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateTable({ existsByNumber, save });

    for (const status of [null, 1, 'free', 'RESERVED']) {
      await assert.rejects(
        useCase.create({ number: 12, status: status as string }),
        (error: unknown) => error instanceof DomainError && error.field === 'status',
      );
    }
    assert.equal(existsByNumber.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });
});
