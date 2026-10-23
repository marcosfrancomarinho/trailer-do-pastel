import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeleteAddition } from '../src/application/use-cases/additions/delete-addition.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createAdditionRepository } from './helpers/order-fixtures.js';

describe('DeleteAddition', () => {
  it('deletes the addition using the normalized ID', async (context) => {
    const deleteById = context.mock.fn(async () => {});
    const useCase = new DeleteAddition(createAdditionRepository({ deleteById }));

    await useCase.delete({ additionId: ' addition-1 ' });

    assert.deepEqual(deleteById.mock.calls[0].arguments, ['addition-1']);
  });

  it('rejects an invalid ID before accessing the repository', async (context) => {
    const deleteById = context.mock.fn(async () => {});
    const useCase = new DeleteAddition(createAdditionRepository({ deleteById }));

    await assert.rejects(
      useCase.delete({ additionId: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'additionId',
    );
    assert.equal(deleteById.mock.callCount(), 0);
  });
});
