import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { PrismaProductRepository } from '../src/infrastructure/repositories/prisma-product-repository.js';
import { buildCatalogAddition, buildCatalogProduct } from './helpers/order-fixtures.js';

describe('PrismaProductRepository', () => {
  it('creates product and selected addition links in one nested write', async (context) => {
    const create = context.mock.fn(async () => ({ id: 'product-id' }));
    const prisma = { product: { create } } as unknown as PrismaClient;
    const repository = new PrismaProductRepository(prisma);

    assert.equal(await repository.save(buildCatalogProduct('unused-id', '12.50'), [
      buildCatalogAddition('addition-1', '2.50'),
      buildCatalogAddition('addition-2', '1.00'),
    ]), 'product-id');
    assert.deepEqual(create.mock.calls[0].arguments, [{
      data: {
        name: 'Pastel de queijo',
        description: 'Preparado na hora',
        categoryId: 'category-1',
        price: '12.5',
        available: true,
        additions: { create: [{ additionId: 'addition-1' }, { additionId: 'addition-2' }] },
      },
      select: { id: true },
    }]);
  });

  it('creates a product without addition links when none are selected', async (context) => {
    const create = context.mock.fn(async () => ({ id: 'product-id' }));
    const prisma = { product: { create } } as unknown as PrismaClient;

    await new PrismaProductRepository(prisma).save(buildCatalogProduct('unused-id', '12.50'), []);

    const data = create.mock.calls[0].arguments[0].data;
    assert.equal(Object.hasOwn(data, 'additions'), false);
  });
});
