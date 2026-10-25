import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DeleteUser } from '../src/application/use-cases/users/delete-user.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { UserRepository } from '../src/domain/repositories/user-repository.js';

describe('DeleteUser', () => {
  it('deletes another user with a normalized ID', async (context) => {
    const calls: string[] = [];
    const existsById = context.mock.fn(async (id: string) => {
      calls.push('exists');
      return id === 'user-2';
    });
    const deleteById = context.mock.fn(async (_id: string) => {
      calls.push('delete');
    });
    const useCase = new DeleteUser({ existsById, deleteById } as unknown as UserRepository);

    await useCase.delete({ userId: ' user-2 ', currentUserId: 'user-1' });

    assert.deepEqual(existsById.mock.calls[0].arguments, ['user-2']);
    assert.deepEqual(deleteById.mock.calls[0].arguments, ['user-2']);
    assert.deepEqual(calls, ['exists', 'delete']);
  });

  it('rejects self deletion and invalid IDs before accessing the repository', async (context) => {
    const existsById = context.mock.fn(async (_id: string) => true);
    const deleteById = context.mock.fn(async (_id: string) => {});
    const useCase = new DeleteUser({ existsById, deleteById } as unknown as UserRepository);

    await assert.rejects(useCase.delete({ userId: 'user-1', currentUserId: 'user-1' }),
      (error: unknown) => error instanceof ApplicationError && error.code === 'IN_USE');
    await assert.rejects(useCase.delete({ userId: ' ', currentUserId: 'user-1' }),
      (error: unknown) => error instanceof DomainError && error.field === 'userId');

    assert.equal(existsById.mock.callCount(), 0);
    assert.equal(deleteById.mock.callCount(), 0);
  });

  it('rejects an unknown user before deleting', async (context) => {
    const existsById = context.mock.fn(async (_id: string) => false);
    const deleteById = context.mock.fn(async (_id: string) => {});
    const useCase = new DeleteUser({ existsById, deleteById } as unknown as UserRepository);

    await assert.rejects(useCase.delete({ userId: 'missing', currentUserId: 'user-1' }),
      (error: unknown) => error instanceof ApplicationError && error.field === 'userId' && error.code === 'NOT_FOUND');

    assert.deepEqual(existsById.mock.calls[0].arguments, ['missing']);
    assert.equal(deleteById.mock.callCount(), 0);
  });
});
