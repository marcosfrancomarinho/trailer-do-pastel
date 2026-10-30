import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { InfrastructureError } from '../../../../src/infrastructure/errors/infrastructure-error.js';
import { Category } from '../../../../src/domain/entities/category.js';
import { CategoryName } from '../../../../src/domain/value-objects/category/category-name.js';
import { CategorySortOrder } from '../../../../src/domain/value-objects/category/category-sort-order.js';
import { PrismaCategoryRepository } from '../../../../src/infrastructure/repositories/prisma-category-repository.js';

describe('PrismaCategoryRepository', () => {
  it('finds categories as domain entities, including archived entries, or returns null', async () => {
    for (const deletedAt of [null, new Date()]) {
      const repository = new PrismaCategoryRepository({
        category: {
          findUnique: async ({ where }: { where: { name: string } }) => {
            assert.equal(where.name, 'Bebidas');
            return { id: 'category-1', name: where.name, deletedAt, sortOrder: 3 };
          },
        },
      } as unknown as PrismaClient);

      const category: Category | null = await repository.findByName('Bebidas');
      assert.ok(category instanceof Category);
      assert.equal(category.getId(), 'category-1');
      assert.equal(category.getName(), 'Bebidas');
      assert.equal(category.getSortOrder(), 3);
      assert.equal(category.isActive(), deletedAt === null);
    }

    const repository = new PrismaCategoryRepository({
      category: { findUnique: async () => null },
    } as unknown as PrismaClient);
    assert.equal(await repository.findByName('missing'), null);
  });

  it('maps a duplicate name detected during creation', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Duplicate name', {
      code: 'P2002', clientVersion: '6.19.3',
    });
    const repository = new PrismaCategoryRepository({
      category: { create: async () => { throw error; } },
    } as unknown as PrismaClient);

    await assert.rejects(repository.save(Category.create(CategoryName.create('Bebidas'), CategorySortOrder.create(1))),
      (failure: unknown) => failure instanceof InfrastructureError && failure.code === 'ALREADY_EXISTS');
  });

  it('reads the highest persisted sort order', async () => {
    for (const max of [null, 3]) {
      const repository = new PrismaCategoryRepository({
        category: {
          aggregate: async (query: unknown) => {
            assert.deepEqual(query, { _max: { sortOrder: true } });
            return { _max: { sortOrder: max } };
          },
        },
      } as unknown as PrismaClient);

      assert.equal(await repository.findMaxSortOrder(), max);
    }
  });

  it('persists the sort order provided by the entity', async () => {
    const category = {
      create: async (query: unknown) => {
        assert.deepEqual(query, {
          data: { name: 'Bebidas', sortOrder: 2 },
          select: { id: true },
        });
        return { id: 'category-2' };
      },
    };
    const prisma = { category } as unknown as PrismaClient;
    const repository = new PrismaCategoryRepository(prisma);
    assert.equal(await repository.save(Category.create(CategoryName.create('Bebidas'), CategorySortOrder.create(2))), 'category-2');
  });

  it('reactivates archived categories without changing IDs', async () => {
    const category = {
      findUnique: async () => ({ id: 'old-id', deletedAt: new Date() }),
      updateMany: async (args: { data: { deletedAt: Date | null } }) => {
        assert.equal(args.data.deletedAt, null);
        return { count: 1 };
      },
    };
    const repository = new PrismaCategoryRepository({ category } as unknown as PrismaClient);
    assert.equal(await repository.reactivate('old-id'), 'old-id');
  });

  it('rejects a concurrent reactivation', async () => {
    const repository = new PrismaCategoryRepository({
      category: { updateMany: async () => ({ count: 0 }) },
    } as unknown as PrismaClient);
    await assert.rejects(repository.reactivate('old-id'),
      (error: unknown) => error instanceof InfrastructureError && error.code === 'ALREADY_EXISTS');
  });

  it('updates the name of a category', async (context) => {
    const update = context.mock.fn(async () => ({ id: 'category-1' }));
    const prisma = { category: { update } } as unknown as PrismaClient;
    const category = Category.create(CategoryName.create('Pastéis'), undefined, 'category-1');

    await new PrismaCategoryRepository(prisma).update(category);

    assert.deepEqual(update.mock.calls[0].arguments, [{
      where: { id: 'category-1' },
      data: { name: 'Pastéis' },
    }]);
  });

  it('updates the category sort order from the entity', async (context) => {
    const update = context.mock.fn(async () => ({ id: 'category-1' }));
    const prisma = { category: { update } } as unknown as PrismaClient;
    const category = Category.create(CategoryName.create('Pastéis'), CategorySortOrder.create(0), 'category-1');

    await new PrismaCategoryRepository(prisma).update(category);

    assert.deepEqual(update.mock.calls[0].arguments, [{
      where: { id: 'category-1' },
      data: { name: 'Pastéis', sortOrder: 0 },
    }]);
  });

  it('reports duplicate names on update', async () => {
    const category = Category.create(CategoryName.create('Pastéis'), undefined, 'category-1');
    const cases = [
      { prismaCode: 'P2002', field: 'name', applicationCode: 'ALREADY_EXISTS' },
    ];

    for (const { prismaCode, field, applicationCode } of cases) {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Update failed', {
        code: prismaCode,
        clientVersion: '6.19.3',
      });
      const prisma = {
        category: { update: async () => { throw prismaError; } },
      } as unknown as PrismaClient;

      await assert.rejects(
        new PrismaCategoryRepository(prisma).update(category),
        (error: unknown) => error instanceof InfrastructureError
          && error.field === field
          && error.code === applicationCode,
      );
    }
  });

  it('checks category existence by ID', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { id: string } }) =>
      where.id === 'category-1' ? { id: 'category-1' } : null);
    const prisma = { category: { findFirst: findUnique } } as unknown as PrismaClient;
    const repository = new PrismaCategoryRepository(prisma);

    assert.equal(await repository.existsById('category-1'), true);
    assert.equal(await repository.existsById('missing'), false);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { id: 'category-1', deletedAt: null },
      select: { id: true },
    }]);
    assert.deepEqual(findUnique.mock.calls[1].arguments, [{
      where: { id: 'missing', deletedAt: null },
      select: { id: true },
    }]);
  });

  it('deletes a category by ID', async (context) => {
    const remove = context.mock.fn(async () => ({ id: 'category-1' }));
    const prisma = { category: { update: remove } } as unknown as PrismaClient;

    await new PrismaCategoryRepository(prisma).deleteById('category-1');

    assert.equal(remove.mock.callCount(), 1);
    assert.deepEqual(remove.mock.calls[0].arguments[0].where, { id: 'category-1' });
    assert.ok(remove.mock.calls[0].arguments[0].data.deletedAt instanceof Date);
  });

  it('reports missing categories', async () => {
    const cases = [
      { prismaCode: 'P2025', applicationCode: 'NOT_FOUND' },
    ];

    for (const { prismaCode, applicationCode } of cases) {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Deletion failed', {
        code: prismaCode,
        clientVersion: '6.19.3',
      });
      const prisma = {
        category: { update: async () => { throw prismaError; } },
      } as unknown as PrismaClient;

      await assert.rejects(
        new PrismaCategoryRepository(prisma).deleteById('category-1'),
        (error: unknown) => error instanceof InfrastructureError
          && error.field === 'categoryId'
          && error.code === applicationCode,
      );
    }
  });
});
