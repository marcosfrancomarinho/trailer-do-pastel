import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UpdateCategory } from '../src/application/use-cases/categories/update-category.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createCategoryRepository } from './helpers/order-fixtures.js';

describe('UpdateCategory', () => {
  it('normalizes the category ID and name before updating', async (context) => {
    const update = context.mock.fn(async (category) => {
      assert.equal(category.getId(), 'category-1');
      assert.equal(category.getName(), 'Pastéis');
    });
    const useCase = new UpdateCategory(createCategoryRepository({ update }));

    assert.deepEqual(
      await useCase.update({ name: ' Pastéis ', categoryId: ' category-1 ' }),
      { id: 'category-1' },
    );
    assert.equal(update.mock.callCount(), 1);
  });

  it('rejects an invalid ID or name before updating', async (context) => {
    const update = context.mock.fn(async () => {});
    const useCase = new UpdateCategory(createCategoryRepository({ update }));

    for (const input of [
      { name: 'Pastéis', categoryId: ' ' },
      { name: ' ', categoryId: 'category-1' },
      { name: undefined as unknown as string, categoryId: 'category-1' },
    ]) {
      await assert.rejects(useCase.update(input), DomainError);
    }

    assert.equal(update.mock.callCount(), 0);
  });
});
