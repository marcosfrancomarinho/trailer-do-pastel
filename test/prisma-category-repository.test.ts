import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { PrismaCategoryRepository } from '../src/infrastructure/repositories/prisma-category-repository.js';

describe('PrismaCategoryRepository', () => {
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
});
