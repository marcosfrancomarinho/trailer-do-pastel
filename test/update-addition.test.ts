import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { UpdateAddition } from '../src/application/use-cases/additions/update-addition.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { createAdditionRepository } from './helpers/order-fixtures.js';

describe('UpdateAddition', () => {
  it('updates supplied fields and keeps the existing name', async (context) => {
    const update = context.mock.fn(async (addition) => {
      assert.equal(addition.getId(), 'addition-1');
      assert.equal(addition.getName(), 'Queijo extra');
      assert.equal(addition.getPrice(), '9007199254740993.01');
      assert.equal(addition.isAvailable(), false);
    });
    const repository = createAdditionRepository({ update });
    const existsByName = context.mock.method(repository, 'existsByName');
    const useCase = new UpdateAddition(repository);

    assert.deepEqual(await useCase.update({
      additionId: ' addition-1 ',
      price: '9007199254740993.01',
      available: false,
    }), { id: 'addition-1' });
    assert.equal(existsByName.mock.callCount(), 0);
    assert.equal(update.mock.callCount(), 1);
  });

  it('normalizes a changed name and checks uniqueness before updating', async (context) => {
    const repository = createAdditionRepository();
    const existsByName = context.mock.method(repository, 'existsByName');
    const update = context.mock.method(repository, 'update');
    const useCase = new UpdateAddition(repository);

    await useCase.update({ additionId: 'addition-1', name: ' Bacon extra ' });

    assert.deepEqual(existsByName.mock.calls[0].arguments, ['Bacon extra']);
    assert.equal(update.mock.calls[0].arguments[0].getName(), 'Bacon extra');
    assert.equal(update.mock.calls[0].arguments[0].getPrice(), '2.5');
  });

  it('rejects missing additions, empty changes, invalid values and duplicate names', async (context) => {
    const update = context.mock.fn(async () => {});
    const repository = createAdditionRepository({ update });
    const useCase = new UpdateAddition(repository);

    await assert.rejects(
      useCase.update({ additionId: 'missing', price: '3' }),
      (error: unknown) => error instanceof ApplicationError
        && error.field === 'additionId'
        && error.code === 'NOT_FOUND',
    );

    for (const input of [
      { additionId: 'addition-1' },
      { additionId: 'addition-1', price: '0' },
      { additionId: 'addition-1', name: ' ' },
      { additionId: 'addition-1', available: null as unknown as boolean },
    ]) {
      await assert.rejects(useCase.update(input), DomainError);
    }

    const duplicateUseCase = new UpdateAddition(createAdditionRepository({
      update,
      existsByName: async () => true,
    }));
    await assert.rejects(
      duplicateUseCase.update({ additionId: 'addition-1', name: 'Bacon extra' }),
      (error: unknown) => error instanceof ApplicationError
        && error.field === 'name'
        && error.code === 'ALREADY_EXISTS',
    );

    assert.equal(update.mock.callCount(), 0);
  });
});
