import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { InfrastructureError } from '../../../../src/infrastructure/errors/infrastructure-error.js';
import { PrismaProductRepository } from '../../../../src/infrastructure/repositories/prisma-product-repository.js';
import { buildCatalogAddition, buildCatalogProduct } from '../../../helpers/order-fixtures.js';

describe('PrismaProductRepository', () => {
  it('checks name uniqueness and returns null for an unknown product', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { name?: string; id?: string } }) =>
      where.name === 'Pastel de queijo' ? { id: 'product-1' } : null);
    const repository = new PrismaProductRepository({ product: { findUnique, findFirst: findUnique } } as unknown as PrismaClient);

    assert.equal(await repository.existsByName('Pastel de queijo'), true);
    assert.equal(await repository.existsByName('Pastel de carne'), false);
    assert.equal(await repository.findById('missing'), null);
  });

  it('checks whether a product ID exists', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { id: string } }) => {
      return where.id === 'product-1' ? { id: 'product-1' } : null;
    });
    const prisma = { product: { findFirst: findUnique } } as unknown as PrismaClient;
    const repository = new PrismaProductRepository(prisma);

    assert.equal(await repository.existsById('product-1'), true);
    assert.equal(await repository.existsById('missing'), false);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [
      { where: { id: 'product-1', deletedAt: null, category: { deletedAt: null } }, select: { id: true } },
    ]);
  });

  it('loads the image URL from a stored product', async () => {
    const prisma = {
      product: {
        findFirst: async () => ({
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

    const product = await new PrismaProductRepository(prisma).findById('product-1');

    assert.equal(product?.getImageUrl(), 'https://example.com/pastel.jpg');
  });

  it('translates Prisma lookup failures into an infrastructure error', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Lookup failed', {
      code: 'P2022', clientVersion: '6',
    });
    const prisma = {
      product: { findFirst: async () => { throw prismaError; } },
    } as unknown as PrismaClient;

    await assert.rejects(
      new PrismaProductRepository(prisma).findById('product-1'),
      (error: unknown) => error instanceof InfrastructureError
        && error.field === 'productId' && error.code === 'PERSISTENCE_FAILED',
    );
  });

  it('creates products with selected additions inside a transaction', async () => {
    let received: unknown;
    const transaction = {
      product: {
        findUnique: async () => null,
        create: async (input: unknown) => {
          received = input;
          return { id: 'product-id' };
        },
      },
    };
    const prisma = {
      $transaction: async (work: (tx: typeof transaction) => Promise<string>) => work(transaction),
    } as unknown as PrismaClient;
    const repository = new PrismaProductRepository(prisma);
    assert.equal(await repository.save(buildCatalogProduct('unused-id', '12.50'), [
      buildCatalogAddition('addition-1', '2.50'),
      buildCatalogAddition('addition-2', '1.00'),
    ]), 'product-id');
    assert.deepEqual(received, {
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
    });
  });

  it('reactivates an archived product with its original ID and new addition links', async () => {
    const calls: string[] = [];
    const tx = {
      product: {
        findUnique: async () => ({ id: 'archived-id', deletedAt: new Date() }),
        updateMany: async (args: { data: { deletedAt: Date | null; price: string } }) => {
          assert.equal(args.data.deletedAt, null);
          assert.equal(args.data.price, '12.5');
          calls.push('restore');
          return { count: 1 };
        },
      },
      productAddition: {
        deleteMany: async () => { calls.push('delete-links'); },
        createMany: async () => { calls.push('new-links'); },
      },
    };
    const prisma = {
      $transaction: async (work: (transaction: typeof tx) => Promise<string>) => work(tx),
    } as unknown as PrismaClient;
    assert.equal(await new PrismaProductRepository(prisma).save(
      buildCatalogProduct('unused-id', '12.50'), [buildCatalogAddition('addition-1', '2.50')],
    ), 'archived-id');
    assert.deepEqual(calls, ['restore', 'delete-links', 'new-links']);
  });

  it('does not overwrite an active product with the same name', async () => {
    const tx = { product: { findUnique: async () => ({ id: 'active-id', deletedAt: null }) } };
    const prisma = {
      $transaction: async (work: (transaction: typeof tx) => Promise<string>) => work(tx),
    } as unknown as PrismaClient;
    await assert.rejects(
      new PrismaProductRepository(prisma).save(buildCatalogProduct('unused-id', '12.50'), []),
      (error: unknown) => error instanceof InfrastructureError && error.code === 'ALREADY_EXISTS',
    );
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

  it('reports duplicate names, missing products and invalid category or addition links on update', async () => {
    const cases = [
      { prismaCode: 'P2002', field: 'name', applicationCode: 'ALREADY_EXISTS' },
      { prismaCode: 'P2025', field: 'productId', applicationCode: 'NOT_FOUND' },
      { prismaCode: 'P2003', field: 'product', applicationCode: 'NOT_FOUND' },
    ];

    for (const { prismaCode, field, applicationCode } of cases) {
      const failure = new Prisma.PrismaClientKnownRequestError('Update failed', {
        code: prismaCode, clientVersion: '6.19.3',
      });
      const prisma = { $transaction: async () => { throw failure; } } as unknown as PrismaClient;

      await assert.rejects(new PrismaProductRepository(prisma).update(buildCatalogProduct('product-1', '12.50')),
        (error: unknown) => error instanceof InfrastructureError
          && error.field === field && error.code === applicationCode);
    }
  });

  it('deletes a product by ID', async (context) => {
    const remove = context.mock.fn(async () => ({ id: 'product-1' }));
    const prisma = { product: { update: remove } } as unknown as PrismaClient;

    await new PrismaProductRepository(prisma).deleteById('product-1');

    assert.deepEqual(remove.mock.calls[0].arguments[0].where, { id: 'product-1' });
    assert.equal(remove.mock.calls[0].arguments[0].data.available, false);
    assert.ok(remove.mock.calls[0].arguments[0].data.deletedAt instanceof Date);
  });

  it('reports a missing product when archiving', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError('Deletion failed', {
      code: 'P2025',
      clientVersion: '6.19.3',
    });
    const prisma = {
      product: { update: async () => { throw prismaError; } },
    } as unknown as PrismaClient;

    await assert.rejects(
      new PrismaProductRepository(prisma).deleteById('product-1'),
      (error: unknown) => error instanceof InfrastructureError
        && error.field === 'productId'
        && error.code === 'NOT_FOUND',
    );
  });
});
