import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeleteCategory } from '../src/application/use-cases/categories/delete-category.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createCategoryRepository } from './helpers/order-fixtures.js';

describe('DeleteCategory', () => {
  it('deletes the category using the normalized ID', async (context) => {
    const deleteById = context.mock.fn(async () => {});
    const useCase = new DeleteCategory(createCategoryRepository({ deleteById }));

    await useCase.delete({ categoryId: ' category-1 ' });

    assert.deepEqual(deleteById.mock.calls[0].arguments, ['category-1']);
  });

  it('rejects an invalid ID before accessing the repository', async (context) => {
    const deleteById = context.mock.fn(async () => {});
    const useCase = new DeleteCategory(createCategoryRepository({ deleteById }));

    await assert.rejects(
      useCase.delete({ categoryId: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'categoryId',
    );
    assert.equal(deleteById.mock.callCount(), 0);
  });
});
