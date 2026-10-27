import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CreateOrderInput } from '../../../../../src/application/dtos/orders/create-order-dto.js';
import { ApplicationError } from '../../../../../src/application/errors/application-error.js';
import { CreateOrder } from '../../../../../src/application/use-cases/orders/create-order.js';
import { CreateOrderItemService } from '../../../../../src/application/services/create-order-item-service.js';
import { CreateOrderItemAdditionService } from '../../../../../src/application/services/create-order-item-addition-service.js';
import { DomainError } from '../../../../../src/domain/errors/domain-error.js';
import type { Order } from '../../../../../src/domain/entities/order.js';
import type { OrderRepository } from '../../../../../src/domain/repositories/order-repository.js';
import type { ProductRepository } from '../../../../../src/domain/repositories/product-repository.js';
import type { AdditionRepository } from '../../../../../src/domain/repositories/addition-repository.js';
import {
  buildCatalogProduct,
  buildCatalogAddition,
  createOrderRepository,
  createProductRepository,
  createAdditionRepository,
} from '../../../../helpers/order-fixtures.js';

describe('CreateOrder', () => {
  const createUseCase = (
    orderRepository: OrderRepository,
    productRepository: ProductRepository = createProductRepository(),
    additionRepository: AdditionRepository = createAdditionRepository(),
  ) => new CreateOrder(
    orderRepository,
    new CreateOrderItemService(productRepository, new CreateOrderItemAdditionService(additionRepository)),
  );
  const input: CreateOrderInput = {
    customerName: ' Marcos ',
    customerPhone: '(11) 99999-9999',
    items: [{ productId: 'product-1', quantity: 2, additions: [] }],
  };

  it('uses catalog names and prices, applies additions per unit, and returns the saved ID and tracking token', async (context) => {
    const save = context.mock.fn(async (order: Order) => {
      assert.equal(order.getCustomerName(), 'Marcos');
      assert.equal(order.getCustomerPhone(), '11999999999');
      assert.equal(order.getStatus(), 'PENDING');
      assert.equal(order.getTotal(), '67');
      const items = order.getItems();
      assert.equal(items[0].getProductName(), 'Pastel especial');
      assert.equal(items[0].getUnitPrice(), '9.75');
      assert.equal(items[0].getQuantity(), 2);
      const additions = items[0].getAdditions();
      assert.equal(additions[0].getUnitPrice(), '3');
      assert.equal(additions[1].getQuantity(), 2);
      return { id: 'order-id', trackingToken: 'tracking-token' };
    });
    const repository = createOrderRepository({ save });
    const productRepository = createProductRepository({
      findProductById: async (id) => id === 'product-1'
        ? buildCatalogProduct(id, '9.75', true, 'Pastel especial')
        : buildCatalogProduct(id, '12.50', true, 'Pastel de carne'),
    });
    const additionRepository = createAdditionRepository({
      findAdditionById: async (id) => buildCatalogAddition(id, id === 'addition-1' ? '3' : '1'),
    });
    const useCase = createUseCase(repository, productRepository, additionRepository);
    const payload = {
      ...input,
      total: '0.01',
      status: 'COMPLETED',
      items: [
        {
          productId: 'product-1', productName: 'Nome falso', unitPrice: '0.01', quantity: 2,
          additions: [
            { additionId: 'addition-1', quantity: 1, unitPrice: '0.01' },
            { additionId: 'addition-2', quantity: 2 },
          ],
        },
        { productId: 'product-2', quantity: 3, additions: [] },
      ],
    };

    assert.deepEqual(await useCase.create(payload), {
      id: 'order-id', trackingToken: 'tracking-token', status: 'PENDING', total: '67', tableId: null,
    });
    assert.equal(save.mock.callCount(), 1);
  });

  it('looks up products and additions for each item, including repeated IDs', async (context) => {
    const repository = createOrderRepository({
      async save(order) {
        assert.equal(order.getItems().length, 2);
        return { id: 'order-id', trackingToken: 'tracking-token' };
      },
    });
    const productRepository = createProductRepository();
    const additionRepository = createAdditionRepository();
    const productLookup = context.mock.method(productRepository, 'findProductById');
    const additionLookup = context.mock.method(additionRepository, 'findAdditionById');
    const useCase = createUseCase(repository, productRepository, additionRepository);

    const output = await useCase.create({
      ...input,
      items: [
        { productId: 'product-1', quantity: 1, additions: [{ additionId: 'addition-1', quantity: 1 }] },
        { productId: 'product-1', quantity: 2, additions: [{ additionId: 'addition-1', quantity: 2 }] },
      ],
    });

    assert.equal(output.total, '42.5');
    assert.equal(productLookup.mock.callCount(), 2);
    assert.equal(additionLookup.mock.callCount(), 2);
  });

  it('keeps item additions separate when the same use case runs concurrently', async () => {
    const useCase = createUseCase(createOrderRepository());
    const payload: CreateOrderInput = {
      ...input,
      items: [{
        ...input.items[0],
        additions: [{ additionId: 'addition-1', quantity: 1 }],
      }],
    };

    const outputs = await Promise.all([useCase.create(payload), useCase.create(payload)]);

    for (const output of outputs) {
      assert.equal(output.total, '25');
    }
  });

  it('does not save when a product or addition is missing or unavailable', async (context) => {
    const withAddition: CreateOrderInput = {
      ...input, items: [{ productId: 'product-1', quantity: 1, additions: [{ additionId: 'addition-1', quantity: 1 }] }],
    };
    const cases: {
      payload: CreateOrderInput;
      productOverrides?: Partial<ProductRepository>;
      additionOverrides?: Partial<AdditionRepository>;
      field: string;
      code: string;
    }[] = [
      { payload: input, productOverrides: { findProductById: async () => null }, field: 'productId', code: 'NOT_FOUND' },
      {
        payload: input,
        productOverrides: { findProductById: async (id) => buildCatalogProduct(id, '10', false) },
        field: 'productId', code: 'UNAVAILABLE',
      },
      { payload: withAddition, additionOverrides: { findAdditionById: async () => null }, field: 'additionId', code: 'NOT_FOUND' },
      {
        payload: withAddition,
        additionOverrides: { findAdditionById: async (id) => buildCatalogAddition(id, '2.50', false) },
        field: 'additionId', code: 'UNAVAILABLE',
      },
      {
        payload: withAddition,
        additionOverrides: { isLinkedToProduct: async () => false },
        field: 'additionId', code: 'NOT_ASSOCIATED',
      },
    ];

    for (const { payload, productOverrides, additionOverrides, field, code } of cases) {
      const repository = createOrderRepository();
      const productRepository = createProductRepository(productOverrides);
      const additionRepository = createAdditionRepository(additionOverrides);
      const save = context.mock.method(repository, 'save');
      await assert.rejects(
        createUseCase(repository, productRepository, additionRepository).create(payload),
        (error: unknown) => error instanceof ApplicationError && error.field === field && error.code === code,
      );
      assert.equal(save.mock.callCount(), 0);
    }
  });

  it('rejects empty orders, invalid item values and duplicated additions without saving', async (context) => {
    const invalidItems: unknown[] = [
      [],
      [{ productId: '', quantity: 1, additions: [] }],
      ...[undefined, 0, -1, 1.5, '1', NaN, Infinity, 2147483648].map((quantity) => [{ productId: 'product-1', quantity, additions: [] }]),
      [{ productId: 'product-1', quantity: 1, additions: [{ additionId: '', quantity: 1 }] }],
      [{ productId: 'product-1', quantity: 1, additions: [{ additionId: 'addition-1', quantity: 0 }] }],
      [{ productId: 'product-1', quantity: 1, additions: [
        { additionId: 'addition-1', quantity: 1 }, { additionId: 'addition-1', quantity: 2 },
      ] }],
    ];
    const repository = createOrderRepository();
    const save = context.mock.method(repository, 'save');
    const useCase = createUseCase(repository);

    for (const items of invalidItems) {
      await assert.rejects(useCase.create({ ...input, items: items as CreateOrderInput['items'] }), DomainError);
    }
    await assert.rejects(useCase.create({ ...input, customerName: ' ' }), DomainError);
    await assert.rejects(useCase.create({ ...input, customerPhone: 'invalid' }), DomainError);
    assert.equal(save.mock.callCount(), 0);
  });

  it('keeps decimal calculations exact', async () => {
    const repository = createOrderRepository();
    const productRepository = createProductRepository({
      findProductById: async (id) => buildCatalogProduct(id, '0.10'),
    });
    const additionRepository = createAdditionRepository({
      findAdditionById: async (id) => buildCatalogAddition(id, '0.20'),
    });
    const output = await createUseCase(repository, productRepository, additionRepository).create({
      ...input, items: [{ productId: 'product-1', quantity: 3, additions: [{ additionId: 'addition-1', quantity: 1 }] }],
    });

    assert.equal(output.total, '0.9');
  });

  it('links a table when provided and keeps app orders without one', async () => {
    const seenTableIds: (string | null)[] = [];
    const repository = createOrderRepository({
      async save(order) {
        seenTableIds.push(order.getTableId());
        return { id: 'order-id', trackingToken: 'tracking-token' };
      },
    });
    const useCase = createUseCase(repository);

    assert.equal((await useCase.create({ ...input, tableId: ' table-1 ', userId: 'employee-1' })).tableId, 'table-1');
    assert.equal((await useCase.create({ ...input, tableId: null })).tableId, null);
    assert.equal((await useCase.create(input)).tableId, null);
    assert.deepEqual(seenTableIds, ['table-1', null, null]);
  });

  it('rejects invalid table IDs before saving', async (context) => {
    const repository = createOrderRepository();
    const save = context.mock.method(repository, 'save');

    await assert.rejects(
      createUseCase(repository).create({ ...input, tableId: '  ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'tableId' && error.code === 'EMPTY',
    );
    assert.equal(save.mock.callCount(), 0);
  });

  it('saves a trimmed observation and rejects invalid observations before saving', async (context) => {
    const repository = createOrderRepository({
      async save(order) {
        assert.equal(order.getObservation(), 'Sem cebola');
        return { id: 'order-id', trackingToken: 'tracking-token' };
      },
    });
    const save = context.mock.method(repository, 'save');
    const useCase = createUseCase(repository);

    await useCase.create({ ...input, observation: '  Sem cebola  ' });
    assert.equal(save.mock.callCount(), 1);

    for (const observation of [42, 'x'.repeat(501)]) {
      await assert.rejects(
        useCase.create({ ...input, observation: observation as string }),
        (error: unknown) => error instanceof DomainError
          && error.field === 'observation'
          && error.code === (typeof observation === 'string' ? 'TOO_LONG' : 'INVALID_TYPE'),
      );
    }
    assert.equal(save.mock.callCount(), 1);
  });

  it('propagates lookup failures without saving and preserves save errors', async (context) => {
    const failure = new Error('Database unavailable');
    const repository = createOrderRepository();
    const productRepository = createProductRepository({ findProductById: async () => { throw failure; } });
    const save = context.mock.method(repository, 'save');

    await assert.rejects(createUseCase(repository, productRepository).create(input), (error: unknown) => error === failure);
    assert.equal(save.mock.callCount(), 0);

    const failingSave = createOrderRepository({ save: async () => { throw failure; } });
    await assert.rejects(createUseCase(failingSave).create(input), (error: unknown) => error === failure);
  });

  it('does not persist a partially built order when a later item is unavailable', async (context) => {
    const repository = createOrderRepository();
    const save = context.mock.method(repository, 'save');
    const useCase = createUseCase(repository);
    const payload: CreateOrderInput = {
      ...input,
      items: [input.items[0], { ...input.items[0], productId: 'missing-product' }],
    };

    await assert.rejects(
      useCase.create(payload),
      (error: unknown) => error instanceof ApplicationError && error.field === 'productId' && error.code === 'NOT_FOUND',
    );
    assert.equal(save.mock.callCount(), 0);
  });

  it('propagates addition lookup errors without saving', async (context) => {
    const failure = new Error('Addition lookup failed');
    const repository = createOrderRepository();
    const save = context.mock.method(repository, 'save');
    const additionRepository = createAdditionRepository({
      findAdditionById: async () => { throw failure; },
    });
    const useCase = createUseCase(repository, createProductRepository(), additionRepository);
    const payload: CreateOrderInput = {
      ...input,
      items: [{
        ...input.items[0],
        additions: [{ additionId: 'addition-1', quantity: 1 }],
      }],
    };

    await assert.rejects(useCase.create(payload), (error: unknown) => error === failure);
    assert.equal(save.mock.callCount(), 0);
  });
});
