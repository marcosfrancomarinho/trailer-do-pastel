import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../../../src/application/errors/application-error.js';
import { Category } from '../../../../src/domain/entities/category.js';
import { CategoryName } from '../../../../src/domain/value-objects/category/category-name.js';
import { PrismaCategoryRepository } from '../../../../src/infrastructure/repositories/prisma-category-repository.js';

describe('PrismaCategoryRepository', () => {
  it('creates a new category', async () => {
    const category = {
      findUnique: async () => null,
      create: async () => ({ id: 'category-2' }),
    };
    const prisma = { category } as unknown as PrismaClient;
    const repository = new PrismaCategoryRepository(prisma);
    assert.equal(await repository.save(Category.create(CategoryName.create('Bebidas'))), 'category-2');
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
    assert.equal(await repository.save(Category.create(CategoryName.create('Pastéis'))), 'old-id');
  });

  it('rejects a category which is still active', async () => {
    const category = { findUnique: async () => ({ id: 'active-id', deletedAt: null }) };
    const repository = new PrismaCategoryRepository({ category } as unknown as PrismaClient);
    await assert.rejects(repository.save(Category.create(CategoryName.create('Pastéis'))),
      (error: unknown) => error instanceof ApplicationError && error.code === 'ALREADY_EXISTS');
  });

  it('updates the name of a category', async (context) => {
    const update = context.mock.fn(async () => ({ id: 'category-1' }));
    const prisma = { category: { update } } as unknown as PrismaClient;
    const category = Category.create(CategoryName.create('Pastéis'), 'category-1');

    await new PrismaCategoryRepository(prisma).update(category);

    assert.deepEqual(update.mock.calls[0].arguments, [{
      where: { id: 'category-1' },
      data: { name: 'Pastéis' },
    }]);
  });

  it('reports duplicate names and missing categories on update', async () => {
    const category = Category.create(CategoryName.create('Pastéis'), 'category-1');
    const cases = [
      { prismaCode: 'P2002', field: 'name', applicationCode: 'ALREADY_EXISTS' },
      { prismaCode: 'P2025', field: 'categoryId', applicationCode: 'NOT_FOUND' },
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
        (error: unknown) => error instanceof ApplicationError
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
        (error: unknown) => error instanceof ApplicationError
          && error.field === 'categoryId'
          && error.code === applicationCode,
      );
    }
  });
});
