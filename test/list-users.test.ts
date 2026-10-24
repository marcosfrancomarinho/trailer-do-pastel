import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ListUsers } from '../src/application/use-cases/users/list-users.js';

describe('ListUsers', () => {
  it('returns the safe user list from the query', async () => {
    const users = [{ id: 'user-1', name: 'Marcos', role: 'ADMIN' as const, createdAt: '2026-10-23T10:00:00.000Z' }];
    const useCase = new ListUsers({ findAll: async () => users });
    assert.deepEqual(await useCase.list(), users);
  });
});
