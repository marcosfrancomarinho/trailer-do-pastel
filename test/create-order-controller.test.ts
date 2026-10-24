import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { CreateOrder } from '../src/application/use-cases/orders/create-order.js';
import { CreateOrderItemService } from '../src/application/services/create-order-item-service.js';
import { CreateOrderItemAdditionService } from '../src/application/services/create-order-item-addition-service.js';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { CreateOrderController } from '../src/infrastructure/http/controllers/orders/create-order-controller.js';
import { createResponse } from './helpers/http-fixtures.js';
import { createOrderRepository, createProductRepository, createAdditionRepository } from './helpers/order-fixtures.js';

function createUseCase(): CreateOrder {
  const additionService = new CreateOrderItemAdditionService(createAdditionRepository());
  const itemService = new CreateOrderItemService(createProductRepository(), additionService);
  return new CreateOrder(createOrderRepository(), itemService);
}

describe('CreateOrderController', () => {
  const item = { productId: 'product-1', quantity: 2 };
  const customer = { customerName: 'Marcos', customerPhone: '11999999999' };

  it('maps nested input fields, defaults missing additions to an empty list and responds with 201', async (context) => {
    const useCase = createUseCase();
    const create = context.mock.method(useCase, 'create');
    const controller = new CreateOrderController(useCase);
    const addition = { additionId: 'addition-1', quantity: 1 };
    const request = {
      body: {
        ...customer,
        total: '0.01', status: 'COMPLETED', userId: 'ignored-user',
        items: [
          { ...item, id: 'ignored-item', productName: 'Nome falso', unitPrice: '0.01', additions: [{ ...addition, id: 'ignored-addition', unitPrice: '0.01' }] },
          { ...item, unitPrice: '0.01', quantity: 1 },
        ],
      },
    } as Request;
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute(request, response, next);

    assert.deepEqual(create.mock.calls[0].arguments, [{
      ...customer,
      items: [
        { ...item, additions: [addition] },
        { ...item, quantity: 1, additions: [] },
      ],
    }]);
    assert.deepEqual(status.mock.calls[0].arguments, [201]);
    assert.deepEqual(json.mock.calls[0].arguments, [{
      id: 'order-id', trackingToken: 'tracking-token', status: 'PENDING', total: '35', tableId: null,
    }]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes the order observation to the use case', async (context) => {
    const useCase = createUseCase();
    const create = context.mock.method(useCase, 'create');
    const controller = new CreateOrderController(useCase);
    const { response } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ body: { ...customer, observation: 'Sem cebola', items: [item] } } as Request, response, next);

    assert.equal(create.mock.calls[0].arguments[0].observation, 'Sem cebola');
    assert.equal(next.mock.callCount(), 0);
  });

  it('passes a table ID or explicit null to the use case', async (context) => {
    for (const tableId of ['table-1', null]) {
      const useCase = createUseCase();
      const create = context.mock.method(useCase, 'create');
      const controller = new CreateOrderController(useCase);
      const { response } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ body: { ...customer, tableId, items: [item] } } as Request, response, next);

      assert.equal(create.mock.calls[0].arguments[0].tableId, tableId);
      assert.equal(next.mock.callCount(), 0);
    }
  });

  it('passes an empty item list to the use case when items are not informed', async (context) => {
    for (const body of [customer, { ...customer, items: undefined }, { ...customer, items: null }]) {
      const useCase = createUseCase();
      const create = context.mock.method(useCase, 'create');
      const controller = new CreateOrderController(useCase);
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ body } as Request, response, next);

      const error = next.mock.calls[0].arguments[0];
      assert.ok(error instanceof DomainError);
      assert.equal(error.field, 'items');
      assert.equal(error.code, 'EMPTY');
      assert.deepEqual(create.mock.calls[0].arguments, [{ ...customer, items: [] }]);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
    }
  });

  it('defaults missing or null additions to an empty array', async (context) => {
    for (const additions of [undefined, null]) {
      const useCase = createUseCase();
      const create = context.mock.method(useCase, 'create');
      const controller = new CreateOrderController(useCase);
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ body: { ...customer, items: [{ ...item, additions }] } } as Request, response, next);

      assert.deepEqual(create.mock.calls[0].arguments, [{ ...customer, items: [{ ...item, additions: [] }] }]);
      assert.deepEqual(status.mock.calls[0].arguments, [201]);
      assert.deepEqual(json.mock.calls[0].arguments, [{
        id: 'order-id', trackingToken: 'tracking-token', status: 'PENDING', total: '20', tableId: null,
      }]);
      assert.equal(next.mock.callCount(), 0);
    }
  });

  it('lets the entity reject an empty order and forwards its error', async (context) => {
    const controller = new CreateOrderController(createUseCase());
    const { response, status } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ body: { ...customer, items: [] } } as Request, response, next);

    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, 'EMPTY');
    assert.equal(error.field, 'items');
    assert.equal(status.mock.callCount(), 0);
  });

  it('forwards use case failures without writing a response', async (context) => {
    const errors = [
      new DomainError('quantity', 'NON_POSITIVE', 'Quantidade inválida.'),
      new ApplicationError('productId', 'NOT_FOUND', 'Produto não encontrado.'),
      new Error('Database unavailable'),
    ];

    for (const error of errors) {
      const useCase = createUseCase();
      context.mock.method(useCase, 'create', async () => { throw error; });
      const controller = new CreateOrderController(useCase);
      const { response, status, json } = createResponse(context);
      const next = context.mock.fn();

      await controller.execute({ body: { ...customer, items: [item] } } as Request, response, next);

      assert.deepEqual(next.mock.calls[0].arguments, [error]);
      assert.equal(next.mock.callCount(), 1);
      assert.equal(status.mock.callCount(), 0);
      assert.equal(json.mock.callCount(), 0);
    }
  });
});
