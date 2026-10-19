import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateProduct } from '../src/application/use-cases/create-product.js';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DomainError } from '../src/domain/errors/domain-error.js';

describe('CreateProduct', () => {
  const input = { name: ' Pastel de queijo ', description: 'Queijo', price: '12.50', categoryId: 'category-1' };

  it('looks up the normalized name before saving and returns the generated ID', async () => {
    const calls: string[] = [];
    const useCase = new CreateProduct({
      findProductById: async () => null,
      async existsByName(name) {
        calls.push('lookup');
        assert.equal(name, 'Pastel de queijo');
        return false;
      },
      async save(product) {
        calls.push('save');
        assert.equal(product.getName(), 'Pastel de queijo');
        assert.equal(product.getPrice().getValue(), '12.5');
        assert.equal(product.getDescription(), input.description);
        assert.equal(product.getCategoryId(), input.categoryId);
        assert.equal(product.isAvailable(), true);
        return 'generated-id';
      },
    });

    assert.deepEqual(await useCase.create(input), { id: 'generated-id' });
    assert.deepEqual(calls, ['lookup', 'save']);
  });

  it('preserves an explicit unavailable status and decimal precision when saving', async () => {
    const price = '9007199254740993.01';
    const useCase = new CreateProduct({
      findProductById: async () => null,
      async existsByName() {
        return false;
      },
      async save(product) {
        assert.equal(product.isAvailable(), false);
        assert.equal(product.getPrice().getValue(), price);
        return 'generated-id';
      },
    });

    assert.deepEqual(await useCase.create({ ...input, price, available: false }), { id: 'generated-id' });
  });

  it('rejects an existing name before constructing the remaining value objects or saving', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateProduct({
      findProductById: async () => null,
      async existsByName() {
        return true;
      },
      save,
    });

    await assert.rejects(useCase.create({ ...input, price: '0', description: '' }), (error: unknown) => {
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.name, 'ApplicationError');
      assert.equal(error.field, 'name');
      assert.equal(error.code, 'ALREADY_EXISTS');
      assert.equal(error.message, 'Já existe um produto cadastrado com esse nome.');
      return true;
    });
    assert.equal(save.mock.callCount(), 0);
  });

  it('does not save when the lookup fails', async (context) => {
    const failure = new Error('Database unavailable');
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateProduct({
      findProductById: async () => null,
      async existsByName() {
        throw failure;
      },
      save,
    });

    await assert.rejects(useCase.create(input), (error: unknown) => error === failure);
    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects invalid price payloads without saving', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateProduct({
      findProductById: async () => null,
      async existsByName() {
        return false;
      },
      save,
    });

    const invalidPrices: unknown[] = ['', ' ', 'abc', '12.5abc', 'NaN', 'Infinity', '0', '-1', true, null, undefined, 12.5];

    for (const price of invalidPrices) {
      await assert.rejects(useCase.create({ ...input, price: price as string }), DomainError);
    }

    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects an invalid name before consulting the repository', async (context) => {
    const existsByName = context.mock.fn(async () => false);
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateProduct({ findProductById: async () => null, existsByName, save });

    await assert.rejects(
      useCase.create({ ...input, name: '  ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'name' && error.code === 'EMPTY',
    );
    assert.equal(existsByName.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects an invalid description without saving after checking the name', async (context) => {
    const existsByName = context.mock.fn(async () => false);
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateProduct({ findProductById: async () => null, existsByName, save });

    await assert.rejects(
      useCase.create({ ...input, description: '  ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'description' && error.code === 'EMPTY',
    );
    assert.equal(existsByName.mock.callCount(), 1);
    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects a missing category without saving', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateProduct({ findProductById: async () => null, existsByName: async () => false, save });

    await assert.rejects(
      useCase.create({ ...input, categoryId: null as unknown as string }),
      (error: unknown) => error instanceof DomainError && error.field === 'categoryId' && error.code === 'REQUIRED',
    );
    assert.equal(save.mock.callCount(), 0);
  });

  it('propagates save failures, including a duplicate detected after the lookup', async () => {
    const failures = [
      new Error('Save failed'),
      new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um produto cadastrado com esse nome.'),
    ];

    for (const failure of failures) {
      const useCase = new CreateProduct({
        findProductById: async () => null,
        async existsByName() {
          return false;
        },
        async save() {
          throw failure;
        },
      });

      await assert.rejects(useCase.create(input), (error: unknown) => error === failure);
    }
  });
});
