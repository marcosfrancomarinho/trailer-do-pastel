import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CreateOrderItemInput } from '../../../../src/application/dtos/orders/create-order-dto.js';
import { ApplicationError } from '../../../../src/application/errors/application-error.js';
import { CreateOrderItemService } from '../../../../src/application/services/create-order-item-service.js';
import { CreateOrderItemAdditionService } from '../../../../src/application/services/create-order-item-addition-service.js';
import { DomainError } from '../../../../src/domain/errors/domain-error.js';
import {
  buildCatalogProduct,
  buildOrderAddition,
  createAdditionRepository,
  createProductRepository,
} from '../../../helpers/order-fixtures.js';

describe('CreateOrderItemService', () => {
  const input: CreateOrderItemInput = {
    productId: 'product-1', quantity: 2,
    additions: [
      { additionId: 'cheese', quantity: 2 },
      { additionId: 'olives', quantity: 1 },
    ],
  };

  it('uses the catalog name and price and delegates each addition to the injected service', async (context) => {
    const repository = createProductRepository({
      findById: async () => buildCatalogProduct('product-1', '9.75', true, 'Pastel especial'),
    });
    const lookup = context.mock.method(repository, 'findById');
    const additionService = new CreateOrderItemAdditionService(createAdditionRepository());
    const createAddition = context.mock.method(additionService, 'create', async (addition) => (
      buildOrderAddition(addition.quantity, addition.additionId === 'cheese' ? '0.50' : '0.25', addition.additionId)
    ));
    const service = new CreateOrderItemService(repository, additionService);

    const item = await service.create(input);
    const unitPrice = item.getUnitPrice();
    const additions = item.getAdditions();

    assert.equal(item.getProductId(), 'product-1');
    assert.equal(item.getProductName(), 'Pastel especial');
    assert.equal(item.getQuantity(), 2);
    assert.equal(unitPrice, '9.75');
    assert.equal(item.getTotal(), '22');
    assert.deepEqual(additions.map((addition) => addition.getAdditionId()), ['cheese', 'olives']);
    assert.deepEqual(lookup.mock.calls[0].arguments, ['product-1']);
    assert.equal(createAddition.mock.callCount(), 2);
    assert.deepEqual(createAddition.mock.calls.map((call) => call.arguments), input.additions.map((addition) => [addition, 'product-1']));
  });

  it('does not create additions when the product is missing or unavailable', async (context) => {
    const cases = [
      { product: null, code: 'NOT_FOUND' },
      { product: buildCatalogProduct('product-1', '10', false), code: 'UNAVAILABLE' },
    ];

    for (const { product, code } of cases) {
      const repository = createProductRepository({ findById: async () => product });
      const additionService = new CreateOrderItemAdditionService(createAdditionRepository());
      const createAddition = context.mock.method(additionService, 'create');
      const service = new CreateOrderItemService(repository, additionService);

      await assert.rejects(
        service.create(input),
        (error: unknown) => error instanceof ApplicationError && error.field === 'productId' && error.code === code,
      );
      assert.equal(createAddition.mock.callCount(), 0);
    }
  });

  it('validates IDs and quantities before looking up the product or creating additions', async (context) => {
    const repository = createProductRepository();
    const lookup = context.mock.method(repository, 'findById');
    const additionService = new CreateOrderItemAdditionService(createAdditionRepository());
    const createAddition = context.mock.method(additionService, 'create');
    const service = new CreateOrderItemService(repository, additionService);
    const payloads = [
      { ...input, productId: '' },
      { ...input, quantity: 0 },
    ];

    for (const payload of payloads) {
      await assert.rejects(service.create(payload), DomainError);
    }
    assert.equal(lookup.mock.callCount(), 0);
    assert.equal(createAddition.mock.callCount(), 0);
  });

  it('propagates addition service errors after starting all additions', async (context) => {
    const failure = new ApplicationError('additionId', 'NOT_FOUND', 'Adicional não encontrado.');
    const additionService = new CreateOrderItemAdditionService(createAdditionRepository());
    const createAddition = context.mock.method(additionService, 'create', async () => { throw failure; });
    const service = new CreateOrderItemService(createProductRepository(), additionService);

    await assert.rejects(service.create(input), (error: unknown) => error === failure);
    assert.equal(createAddition.mock.callCount(), input.additions.length);
  });

  it('keeps the entity validation against repeated additions', async () => {
    const additionService = new CreateOrderItemAdditionService(createAdditionRepository());
    const service = new CreateOrderItemService(createProductRepository(), additionService);
    const addition = { additionId: 'addition-1', quantity: 1 };

    await assert.rejects(
      service.create({ ...input, additions: [addition, { ...addition, quantity: 2 }] }),
      (error: unknown) => error instanceof DomainError && error.field === 'additions' && error.code === 'DUPLICATE',
    );
  });
});
