import { Category } from '../../../../../src/domain/entities/category.js';
import { CategoryName } from '../../../../../src/domain/value-objects/category/category-name.js';
import { createCategoryRepository } from '../../../../helpers/order-fixtures.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../../../../../src/application/errors/application-error.js';
import { CreateCategory } from '../../../../../src/application/use-cases/categories/create-category.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';

describe('CreateCategory', () => {
  it('rejects an active category without saving or reactivating', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const reactivate = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateCategory(createCategoryRepository({
      findByName: async () => Category.create(CategoryName.create('Bebidas'), 'active-id'),
      save,
      reactivate,
    }));

    await assert.rejects(useCase.create({ name: 'Bebidas' }),
      (error: unknown) => error instanceof ApplicationError && error.code === 'ALREADY_EXISTS');
    assert.equal(save.mock.callCount(), 0);
    assert.equal(reactivate.mock.callCount(), 0);
  });

  it('reactivates an archived category preserving its ID', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const reactivate = context.mock.fn(async (id: string) => id);
    const useCase = new CreateCategory(createCategoryRepository({
      findByName: async () => Category.create(CategoryName.create('Bebidas'), 'archived-id', new Date()),
      save,
      reactivate,
    }));

    assert.deepEqual(await useCase.create({ name: 'Bebidas' }), { id: 'archived-id' });
    assert.deepEqual(reactivate.mock.calls[0].arguments, ['archived-id']);
    assert.equal(save.mock.callCount(), 0);
  });

  it('normalizes the name, saves the category and returns its ID', async () => {
    const calls: string[] = [];
    const useCase = new CreateCategory(createCategoryRepository({
      existsById: async () => false,
      async findByName(name) {
        assert.equal(name, 'Pastéis');
        return null;
      },
      async save(category) {
        calls.push('save');
        assert.equal(category.getName(), 'Pastéis');
        return 'category-id';
      },
    }));

    assert.deepEqual(await useCase.create({ name: ' Pastéis ' }), { id: 'category-id' });
    assert.deepEqual(calls, ['save']);
  });

  it('rejects an invalid name before consulting the repository', async (context) => {
    const findByName = context.mock.fn(async () => null);
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateCategory(createCategoryRepository({ existsById: async () => false, findByName, save }));

    for (const name of [null, '  ']) {
      await assert.rejects(
        useCase.create({ name: name as string }),
        (error: unknown) => error instanceof DomainError && error.field === 'name',
      );
    }

    assert.equal(findByName.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('propagates repository failures', async () => {
    const failure = new Error('Database unavailable');
    const useCase = new CreateCategory(createCategoryRepository({
      existsById: async () => false,
      existsByName: async () => false,
      save: async () => { throw failure; },
    }));

    await assert.rejects(useCase.create({ name: 'Pastéis' }), (error: unknown) => error === failure);
  });
});
