import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { PrismaProductRepository } from '../src/infrastructure/repositories/prisma-product-repository.js';
import { buildCatalogAddition, buildCatalogProduct } from './helpers/order-fixtures.js';

describe('PrismaProductRepository', () => {
  it('checks whether a product ID exists', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { id: string } }) => {
      return where.id === 'product-1' ? { id: 'product-1' } : null;
    });
    const prisma = { product: { findUnique } } as unknown as PrismaClient;
    const repository = new PrismaProductRepository(prisma);

    assert.equal(await repository.existsById('product-1'), true);
    assert.equal(await repository.existsById('missing'), false);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [
      { where: { id: 'product-1' }, select: { id: true } },
    ]);
  });

  it('loads the image URL from a stored product', async () => {
    const prisma = {
      product: {
        findUnique: async () => ({
          id: 'product-1',
          name: 'Pastel de queijo',
          description: 'Preparado na hora',
          categoryId: 'category-1',
          price: '12.50',
          imageUrl: 'https://example.com/pastel.jpg',
          available: true,
        }),
      },
    } as unknown as PrismaClient;

    const product = await new PrismaProductRepository(prisma).findProductById('product-1');

    assert.equal(product?.getImageUrl(), 'https://example.com/pastel.jpg');
  });

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
        imageUrl: null,
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

  it('updates product fields and replaces addition links in one transaction', async (context) => {
    const calls: string[] = [];
    const update = context.mock.fn(async () => { calls.push('update'); });
    const deleteMany = context.mock.fn(async () => { calls.push('delete'); });
    const createMany = context.mock.fn(async () => { calls.push('create'); });
    const transaction = context.mock.fn(async (operation) => operation({
      product: { update },
      productAddition: { deleteMany, createMany },
    }));
    const prisma = { $transaction: transaction } as unknown as PrismaClient;
    const repository = new PrismaProductRepository(prisma);

    await repository.update(buildCatalogProduct('product-1', '14.50'), [buildCatalogAddition('addition-1', '2.50')]);

    assert.deepEqual(calls, ['update', 'delete', 'create']);
    assert.deepEqual(update.mock.calls[0].arguments[0], {
      where: { id: 'product-1' },
      data: {
        name: 'Pastel de queijo',
        description: 'Preparado na hora',
        categoryId: 'category-1',
        price: '14.5',
        imageUrl: null,
        available: true,
      },
      select: { id: true },
    });
    assert.deepEqual(deleteMany.mock.calls[0].arguments[0], { where: { productId: 'product-1' } });
    assert.deepEqual(createMany.mock.calls[0].arguments[0], {
      data: [{ productId: 'product-1', additionId: 'addition-1' }],
    });
  });

  it('leaves addition links untouched when omitted and removes all when given an empty list', async (context) => {
    const update = context.mock.fn(async () => {});
    const deleteMany = context.mock.fn(async () => {});
    const createMany = context.mock.fn(async () => {});
    const prisma = {
      $transaction: async (operation) => operation({ product: { update }, productAddition: { deleteMany, createMany } }),
    } as unknown as PrismaClient;
    const repository = new PrismaProductRepository(prisma);
    const product = buildCatalogProduct('product-1', '14.50');

    await repository.update(product);
    assert.equal(deleteMany.mock.callCount(), 0);

    await repository.update(product, []);
    assert.equal(deleteMany.mock.callCount(), 1);
    assert.equal(createMany.mock.callCount(), 0);
  });

  it('deletes a product by ID', async (context) => {
    const remove = context.mock.fn(async () => ({ id: 'product-1' }));
    const prisma = { product: { delete: remove } } as unknown as PrismaClient;

    await new PrismaProductRepository(prisma).deleteById('product-1');

    assert.deepEqual(remove.mock.calls[0].arguments, [{ where: { id: 'product-1' } }]);
  });

  it('reports a product used in orders', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Deletion failed', {
      code: 'P2003',
      clientVersion: '6.19.3',
    });
    const prisma = {
      product: { delete: async () => { throw prismaError; } },
    } as unknown as PrismaClient;

    await assert.rejects(
      new PrismaProductRepository(prisma).deleteById('product-1'),
      (error: unknown) => error instanceof ApplicationError
        && error.field === 'productId'
        && error.code === 'IN_USE',
    );
  });
});
