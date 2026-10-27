import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ListAdditionsByProduct } from '../../../../../../src/application/use-cases/additions/list-additions-by-product.js';
import { DomainError } from '../../../../../../src/domain/errors/domain-error.js';
import { ListAdditionsByProductController } from '../../../../../../src/infrastructure/http/controllers/additions/list-additions-by-product-controller.js';
import { createResponse } from '../../../../../helpers/http-fixtures.js';

describe('ListAdditionsByProductController', () => {
  it('returns linked additions with status 200', async (context) => {
    const additions = [{ id: 'addition-1', name: 'Queijo extra', price: '2.5', available: false }];
    const findByProductId = context.mock.fn(async () => additions);
    const controller = new ListAdditionsByProductController(new ListAdditionsByProduct({
      findAll: async () => [],
      findByProductId,
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { productId: 'product-1' } } as unknown as Request, response, next);

    assert.deepEqual(findByProductId.mock.calls[0].arguments, ['product-1']);
    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [additions]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('returns an empty list for a product without linked additions', async (context) => {
    const controller = new ListAdditionsByProductController(new ListAdditionsByProduct({
      findAll: async () => [],
      findByProductId: async () => [],
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { productId: 'product-1' } } as unknown as Request, response, next);

    assert.deepEqual(status.mock.calls[0].arguments, [200]);
    assert.deepEqual(json.mock.calls[0].arguments, [[]]);
    assert.equal(next.mock.callCount(), 0);
  });

  it('forwards invalid product IDs to the error handler', async (context) => {
    const findByProductId = context.mock.fn(async () => []);
    const controller = new ListAdditionsByProductController(new ListAdditionsByProduct({
      findAll: async () => [],
      findByProductId,
    }));
    const { response, status, json } = createResponse(context);
    const next = context.mock.fn();

    await controller.execute({ params: { productId: ' ' } } as unknown as Request, response, next);

    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof DomainError);
    assert.equal(error.field, 'productId');
    assert.equal(findByProductId.mock.callCount(), 0);
    assert.equal(status.mock.callCount(), 0);
    assert.equal(json.mock.callCount(), 0);
  });
});
