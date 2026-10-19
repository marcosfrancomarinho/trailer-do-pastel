import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { CreateOrderItemAdditionService } from '../src/application/services/create-order-item-addition-service.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { buildCatalogAddition, createAdditionRepository } from './helpers/order-fixtures.js';

describe('CreateOrderItemAdditionService', () => {
  const input = { additionId: 'addition-1', quantity: 2, unitPrice: '0.75' };

  it('looks up the addition and uses the input quantity and price', async (context) => {
    const repository = createAdditionRepository();
    const lookup = context.mock.method(repository, 'findAdditionById');
    const service = new CreateOrderItemAdditionService(repository);

    const addition = await service.create(input);
    const unitPrice = addition.getUnitPrice();
    const total = addition.getTotal();

    assert.equal(addition.getAdditionId(), input.additionId);
    assert.equal(addition.getQuantity(), 2);
    assert.equal(unitPrice, '0.75');
    assert.equal(total, '1.5');
    assert.deepEqual(lookup.mock.calls[0].arguments, ['addition-1']);
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
        service.create(input),
        (error: unknown) => error instanceof ApplicationError && error.field === 'additionId' && error.code === code,
      );
    }
  });

  it('rejects invalid IDs and quantities before looking up the addition', async (context) => {
    const repository = createAdditionRepository();
    const lookup = context.mock.method(repository, 'findAdditionById');
    const service = new CreateOrderItemAdditionService(repository);

    await assert.rejects(service.create({ ...input, additionId: ' ' }), DomainError);
    await assert.rejects(service.create({ ...input, quantity: 0 }), DomainError);
    assert.equal(lookup.mock.callCount(), 0);
  });

  it('preserves repository errors', async () => {
    const failure = new Error('Database unavailable');
    const repository = createAdditionRepository({ findAdditionById: async () => { throw failure; } });
    const service = new CreateOrderItemAdditionService(repository);

    await assert.rejects(service.create(input), (error: unknown) => error === failure);
  });
});
