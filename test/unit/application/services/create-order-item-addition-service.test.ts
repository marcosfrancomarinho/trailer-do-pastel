import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../../../../src/application/errors/application-error.js';
import { CreateOrderItemAdditionService } from '../../../../src/application/services/create-order-item-addition-service.js';
import { DomainError } from '../../../../src/domain/errors/domain-error.js';
import { buildCatalogAddition, createAdditionRepository } from '../../../helpers/order-fixtures.js';

describe('CreateOrderItemAdditionService', () => {
  const input = { additionId: 'addition-1', quantity: 2 };

  it('looks up the addition and uses its catalog price with the requested quantity', async (context) => {
    const repository = createAdditionRepository();
    const lookup = context.mock.method(repository, 'findAdditionById');
    const isLinkedToProduct = context.mock.method(repository, 'isLinkedToProduct');
    const service = new CreateOrderItemAdditionService(repository);

    const addition = await service.create(input, 'product-1');
    const unitPrice = addition.getUnitPrice();
    const total = addition.getTotal();

    assert.equal(addition.getAdditionId(), input.additionId);
    assert.equal(addition.getQuantity(), 2);
    assert.equal(unitPrice, '2.5');
    assert.equal(total, '5');
    assert.deepEqual(lookup.mock.calls[0].arguments, ['addition-1']);
    assert.deepEqual(isLinkedToProduct.mock.calls[0].arguments, ['product-1', 'addition-1']);
  });

  it('rejects missing and unavailable additions with application errors', async () => {
    const cases = [
      { addition: null, code: 'NOT_FOUND' },
      { addition: buildCatalogAddition('addition-1', '2.50', false), code: 'UNAVAILABLE' },
    ];

    for (const { addition, code } of cases) {
      const repository = createAdditionRepository({ findAdditionById: async () => addition });
      const service = new CreateOrderItemAdditionService(repository);

      await assert.rejects(
        service.create(input, 'product-1'),
        (error: unknown) => error instanceof ApplicationError && error.field === 'additionId' && error.code === code,
      );
    }
  });

  it('rejects an addition that does not belong to the product', async (context) => {
    const repository = createAdditionRepository({ isLinkedToProduct: async () => false });
    const lookup = context.mock.method(repository, 'isLinkedToProduct');
    const service = new CreateOrderItemAdditionService(repository);

    await assert.rejects(
      service.create(input, 'product-2'),
      (error: unknown) => error instanceof ApplicationError
        && error.field === 'additionId'
        && error.code === 'NOT_ASSOCIATED',
    );
    assert.deepEqual(lookup.mock.calls[0].arguments, ['product-2', 'addition-1']);
  });

  it('rejects invalid IDs and quantities before looking up the addition', async (context) => {
    const repository = createAdditionRepository();
    const lookup = context.mock.method(repository, 'findAdditionById');
    const service = new CreateOrderItemAdditionService(repository);

    await assert.rejects(service.create({ ...input, additionId: ' ' }, 'product-1'), DomainError);
    await assert.rejects(service.create({ ...input, quantity: 0 }, 'product-1'), DomainError);
    assert.equal(lookup.mock.callCount(), 0);
  });

  it('preserves repository errors', async () => {
    const failure = new Error('Database unavailable');
    const repository = createAdditionRepository({ findAdditionById: async () => { throw failure; } });
    const service = new CreateOrderItemAdditionService(repository);

    await assert.rejects(service.create(input, 'product-1'), (error: unknown) => error === failure);
  });
});
