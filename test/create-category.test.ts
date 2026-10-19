import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { CreateCategory } from '../src/application/use-cases/create-category.js';
import { DomainError } from '../src/domain/errors/domain-error.js';

describe('CreateCategory', () => {
  it('normalizes the name, saves the category and returns its ID', async () => {
    const calls: string[] = [];
    const useCase = new CreateCategory({
      async existsByName(name) {
        calls.push('lookup');
        assert.equal(name, 'Pastéis');
        return false;
      },
      async save(category) {
        calls.push('save');
        assert.equal(category.getName(), 'Pastéis');
        return 'category-id';
      },
    });

    assert.deepEqual(await useCase.create({ name: ' Pastéis ' }), { id: 'category-id' });
    assert.deepEqual(calls, ['lookup', 'save']);
  });

  it('rejects an invalid name before consulting the repository', async (context) => {
    const existsByName = context.mock.fn(async () => false);
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateCategory({ existsByName, save });

    for (const name of [null, '  ']) {
      await assert.rejects(
        useCase.create({ name: name as string }),
        (error: unknown) => error instanceof DomainError && error.field === 'name',
      );
    }

    assert.equal(existsByName.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('does not save a category with an existing name', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateCategory({ existsByName: async () => true, save });

    await assert.rejects(
      useCase.create({ name: 'Pastéis' }),
      (error: unknown) => error instanceof ApplicationError && error.field === 'name' && error.code === 'ALREADY_EXISTS',
    );
    assert.equal(save.mock.callCount(), 0);
  });

  it('propagates repository failures', async () => {
    const failure = new Error('Database unavailable');
    const useCase = new CreateCategory({
      existsByName: async () => false,
      save: async () => { throw failure; },
    });

    await assert.rejects(useCase.create({ name: 'Pastéis' }), (error: unknown) => error === failure);
  });
});
