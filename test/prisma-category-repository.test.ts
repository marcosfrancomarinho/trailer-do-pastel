import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { Category } from '../src/domain/entities/category.js';
import { CategoryName } from '../src/domain/value-objects/category/category-name.js';
import { PrismaCategoryRepository } from '../src/infrastructure/repositories/prisma-category-repository.js';

describe('PrismaCategoryRepository', () => {
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
    const prisma = { category: { findUnique } } as unknown as PrismaClient;
    const repository = new PrismaCategoryRepository(prisma);

    assert.equal(await repository.existsById('category-1'), true);
    assert.equal(await repository.existsById('missing'), false);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { id: 'category-1' },
      select: { id: true },
    }]);
    assert.deepEqual(findUnique.mock.calls[1].arguments, [{
      where: { id: 'missing' },
      select: { id: true },
    }]);
  });

  it('deletes a category by ID', async (context) => {
    const remove = context.mock.fn(async () => ({ id: 'category-1' }));
    const prisma = { category: { delete: remove } } as unknown as PrismaClient;

    await new PrismaCategoryRepository(prisma).deleteById('category-1');

    assert.deepEqual(remove.mock.calls[0].arguments, [{ where: { id: 'category-1' } }]);
  });

  it('reports missing categories and categories with products', async () => {
    const cases = [
      { prismaCode: 'P2025', applicationCode: 'NOT_FOUND' },
      { prismaCode: 'P2003', applicationCode: 'IN_USE' },
    ];

    for (const { prismaCode, applicationCode } of cases) {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Deletion failed', {
        code: prismaCode,
        clientVersion: '6.19.3',
      });
      const prisma = {
        category: { delete: async () => { throw prismaError; } },
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
