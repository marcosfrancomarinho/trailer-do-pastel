import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListTables } from '../../../../../src/application/use-cases/tables/list-tables.js';

describe('ListTables', () => {
  it('returns the table list from the query', async () => {
    const tables = [{ id: 'table-1', number: 1, status: 'FREE' as const, totalSpent: '0' }];
    const useCase = new ListTables({ findAll: async () => tables });
    assert.deepEqual(await useCase.list(), tables);
  });
});
