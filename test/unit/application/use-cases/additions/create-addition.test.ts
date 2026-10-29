import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateAddition } from '../../../../../src/application/use-cases/additions/create-addition.js';
import { ApplicationError } from '../../../../../src/application/errors/application-error.js';
import { buildCatalogAddition, createAdditionRepository } from '../../../../helpers/order-fixtures.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';

describe('CreateAddition', () => {
  const input = { name: ' Queijo extra ', price: '12.50' };

  it('saves the normalized name and returns the generated ID', async () => {
    const calls: string[] = [];
    const useCase = new CreateAddition(createAdditionRepository({
      findById: async () => null,
      async findByName(name) {
        assert.equal(name, 'Queijo extra');
        return null;
      },
      async save(addition) {
        calls.push('save');
        assert.equal(addition.getName(), 'Queijo extra');
        assert.equal(addition.getPrice(), '12.5');
        assert.equal(addition.isAvailable(), true);
        return 'generated-id';
      },
    }));

    assert.deepEqual(await useCase.create(input), { id: 'generated-id' });
    assert.deepEqual(calls, ['save']);
  });

  it('preserves an explicit unavailable status and decimal precision when saving', async () => {
    const price = '9007199254740993.01';
    const useCase = new CreateAddition(createAdditionRepository({
      findById: async () => null,
      async existsByName() {
        return false;
      },
      async save(addition) {
        assert.equal(addition.isAvailable(), false);
        assert.equal(addition.getPrice(), price);
        return 'generated-id';
      },
    }));

    assert.deepEqual(await useCase.create({ ...input, price, available: false }), { id: 'generated-id' });
  });

  it('rejects invalid price payloads without saving', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateAddition(createAdditionRepository({
      findById: async () => null,
      async existsByName() {
        return false;
      },
      save,
    }));

    const invalidPrices: unknown[] = ['', ' ', 'abc', '12.5abc', 'NaN', 'Infinity', '0', '-1', true, null, undefined, 12.5];

    for (const price of invalidPrices) {
      await assert.rejects(useCase.create({ ...input, price: price as string }), DomainError);
    }

    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects an invalid name before consulting the repository', async (context) => {
    const findByName = context.mock.fn(async () => null);
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateAddition(createAdditionRepository({ findById: async () => null, findByName, save }));

    await assert.rejects(
      useCase.create({ ...input, name: '  ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'name' && error.code === 'EMPTY',
    );
    assert.equal(findByName.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects an active name without writing to the repository', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const reactivate = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateAddition(createAdditionRepository({
      findByName: async () => buildCatalogAddition('active-id', '2.50'),
      save,
      reactivate,
    }));

    await assert.rejects(useCase.create(input),
      (error: unknown) => error instanceof ApplicationError && error.code === 'ALREADY_EXISTS');
    assert.equal(save.mock.callCount(), 0);
    assert.equal(reactivate.mock.callCount(), 0);
  });

  it('reactivates an archived addition using its existing ID and the new fields', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateAddition(createAdditionRepository({
      findByName: async () => buildCatalogAddition('archived-id', '2.50', false, new Date()),
      async reactivate(id, addition) {
        assert.equal(id, 'archived-id');
        assert.equal(addition.getPrice(), '12.5');
        assert.equal(addition.isAvailable(), false);
        return id;
      },
      save,
    }));

    assert.deepEqual(await useCase.create({ ...input, available: false }), { id: 'archived-id' });
    assert.equal(save.mock.callCount(), 0);
  });

  it('propagates save failures, including a duplicate detected after the lookup', async () => {
    const failures = [
      new Error('Save failed'),
      new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um adicional cadastrado com esse nome.'),
    ];

    for (const failure of failures) {
      const useCase = new CreateAddition(createAdditionRepository({
        findById: async () => null,
        async existsByName() {
          return false;
        },
        async save() {
          throw failure;
        },
      }));

      await assert.rejects(useCase.create(input), (error: unknown) => error === failure);
    }
  });
});
