import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../src/infrastructure/repositories/prisma-user-repository.js';

describe('PrismaUserRepository.findByName', () => {
  it('reconstitutes the user with the stored hash and ID', async (context) => {
    const hash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const findUnique = context.mock.fn(async () => ({ id: 'user-1', name: 'Marcos', password: hash }));
    const prisma = { user: { findUnique } } as unknown as PrismaClient;

    const user = await new PrismaUserRepository(prisma).findByName('Marcos');

    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { name: 'Marcos' },
      select: { id: true, name: true, password: true },
    }]);
    assert.equal(user?.getId(), 'user-1');
    assert.equal(user?.getName(), 'Marcos');
    assert.equal(user?.getPassword(), hash);
  });

  it('returns null when the user does not exist', async () => {
    const prisma = { user: { findUnique: async () => null } } as unknown as PrismaClient;
    assert.equal(await new PrismaUserRepository(prisma).findByName('missing'), null);
  });
});
