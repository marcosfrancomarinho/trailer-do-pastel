import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { PrismaUserRepository } from '../src/infrastructure/repositories/prisma-user-repository.js';
import { User } from '../src/domain/entities/user.js';
import { UserName } from '../src/domain/value-objects/user/user-name.js';
import { UserPassword } from '../src/domain/value-objects/user/user-password.js';

describe('PrismaUserRepository.findByName', () => {
  it('checks whether a user name is already registered', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { name: string } }) =>
      where.name === 'Marcos' ? { id: 'user-1' } : null);
    const repository = new PrismaUserRepository({ user: { findUnique } } as unknown as PrismaClient);

    assert.equal(await repository.existsByName('Marcos'), true);
    assert.equal(await repository.existsByName('Ana'), false);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{ where: { name: 'Marcos' }, select: { id: true } }]);
  });

  it('reconstitutes the user with the stored hash and ID', async (context) => {
    const hash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const findUnique = context.mock.fn(async () => ({ id: 'user-1', name: 'Marcos', password: hash, role: 'ADMIN' }));
    const prisma = { user: { findUnique } } as unknown as PrismaClient;

    const user = await new PrismaUserRepository(prisma).findByName('Marcos');

    assert.deepEqual(findUnique.mock.calls[0].arguments, [{
      where: { name: 'Marcos' },
      select: { id: true, name: true, password: true, role: true },
    }]);
    assert.equal(user?.getId(), 'user-1');
    assert.equal(user?.getName(), 'Marcos');
    assert.equal(user?.getPassword(), hash);
    assert.equal(user?.getRole(), 'ADMIN');
  });

  it('returns null when the user does not exist', async () => {
    const prisma = { user: { findUnique: async () => null } } as unknown as PrismaClient;
    assert.equal(await new PrismaUserRepository(prisma).findByName('missing'), null);
  });
});

describe('PrismaUserRepository deletion', () => {
  it('checks whether a user ID exists', async (context) => {
    const findUnique = context.mock.fn(async ({ where }: { where: { id: string } }) => {
      return where.id === 'user-2' ? { id: 'user-2' } : null;
    });
    const prisma = { user: { findUnique } } as unknown as PrismaClient;
    const repository = new PrismaUserRepository(prisma);

    assert.equal(await repository.existsById('user-2'), true);
    assert.equal(await repository.existsById('missing'), false);
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{ where: { id: 'user-2' }, select: { id: true } }]);
  });

  it('checks an ID and deletes an existing user', async (context) => {
    const findUnique = context.mock.fn(async () => ({ role: 'EMPLOYEE' }));
    const remove = context.mock.fn(async () => ({ id: 'user-2' }));
    const prisma = { user: { findUnique, delete: remove } } as unknown as PrismaClient;
    const repository = new PrismaUserRepository(prisma);

    assert.equal(await repository.findRoleById('user-2'), 'EMPLOYEE');
    assert.deepEqual(findUnique.mock.calls[0].arguments, [{ where: { id: 'user-2' }, select: { role: true } }]);
    await repository.deleteById('user-2');
    assert.deepEqual(remove.mock.calls[0].arguments, [{ where: { id: 'user-2' } }]);
  });

  it('returns 404 for an unknown user', async () => {
    const failure = new Prisma.PrismaClientKnownRequestError('Missing user', {
      code: 'P2025', clientVersion: '6.19.3',
    });
    const prisma = { user: { delete: async () => { throw failure; } } } as unknown as PrismaClient;
    await assert.rejects(new PrismaUserRepository(prisma).deleteById('missing'),
      (error: unknown) => error instanceof ApplicationError && error.field === 'userId' && error.code === 'NOT_FOUND');
  });

  it('returns null when the user ID does not exist', async () => {
    const prisma = { user: { findUnique: async () => null } } as unknown as PrismaClient;
    assert.equal(await new PrismaUserRepository(prisma).findRoleById('missing'), null);
  });
});

describe('PrismaUserRepository.save', () => {
  it('always creates an employee account through the API', async (context) => {
    const create = context.mock.fn(async () => ({ id: 'user-2' }));
    const prisma = { user: { create } } as unknown as PrismaClient;
    const user = User.create(UserName.create('Funcionário'), UserPassword.create('Pastel123!'));
    user.defineEncryptedPassword('$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

    assert.equal(await new PrismaUserRepository(prisma).save(user), 'user-2');
    assert.equal(create.mock.calls[0].arguments[0].data.role, 'EMPLOYEE');
  });

  it('reports a duplicate name when creation races with another request', async () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('Duplicate', {
      code: 'P2002', clientVersion: '6.19.3',
    });
    const prisma = { user: { create: async () => { throw duplicate; } } } as unknown as PrismaClient;
    const user = User.create(UserName.create('Funcionário'), UserPassword.create('Pastel123!'));
    user.defineEncryptedPassword('$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');

    await assert.rejects(new PrismaUserRepository(prisma).save(user),
      (error: unknown) => error instanceof ApplicationError && error.code === 'ALREADY_EXISTS');
  });
});
