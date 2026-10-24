import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeleteTable } from '../src/application/use-cases/tables/delete-table.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import type { TableRepository } from '../src/domain/repositories/table-repository.js';

describe('DeleteTable', () => {
  it('validates and archives the requested table', async (context) => {
    const archive = context.mock.fn(async () => {});
    const useCase = new DeleteTable({ archive } as unknown as TableRepository);

    await useCase.delete({ tableId: ' table-1 ' });

    assert.deepEqual(archive.mock.calls[0].arguments, ['table-1']);
    await assert.rejects(useCase.delete({ tableId: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'tableId');
    assert.equal(archive.mock.callCount(), 1);
  });
});
