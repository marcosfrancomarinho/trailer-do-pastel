import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateUser } from '../src/application/use-cases/create-user.js';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { User } from '../src/domain/entities/user.js';

describe('CreateUser', () => {
  const input = { name: ' Marcos ', password: '  Senha de teste1!  ' };
  const match = async () => false;

  it('checks the name, hashes the exact password and saves only the hash before returning the ID', async (context) => {
    const calls: string[] = [];
    let now = Date.parse('2026-10-18T12:00:00Z');
    const createdAt = now;
    context.mock.method(Date, 'now', () => now);
    const create = context.mock.method(User, 'create');
    const defineEncryptedPassword = context.mock.method(User.prototype, 'defineEncryptedPassword');
    const useCase = new CreateUser({
      async existsByName(name) {
        calls.push('lookup');
        assert.equal(name, 'Marcos');
        return false;
      },
      async save(user) {
        calls.push('save');
        assert.equal(user.getName(), 'Marcos');
        assert.equal(user.getPassword(), '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
        assert.notEqual(user.getPassword(), input.password);
        assert.equal(user.getCreatedAt().getTime(), createdAt);
        assert.equal(defineEncryptedPassword.mock.callCount(), 1);
        return 'generated-id';
      },
    }, {
      match,
      async hash(password) {
        calls.push('hash');
        assert.equal(password, input.password);
        assert.equal(create.mock.callCount(), 1);
        assert.equal(defineEncryptedPassword.mock.callCount(), 0);
        now += 1000;
        return '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      },
    });

    assert.deepEqual(await useCase.create(input), { id: 'generated-id' });
    assert.deepEqual(calls, ['lookup', 'hash', 'save']);
  });

  it('rejects an existing name before validating or hashing the password', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const hash = context.mock.fn(async () => 'unexpected-hash');
    const useCase = new CreateUser({ existsByName: async () => true, save }, { hash, match });

    await assert.rejects(
      useCase.create({ ...input, password: '' }),
      (error: unknown) => error instanceof ApplicationError && error.field === 'name' && error.code === 'ALREADY_EXISTS',
    );
    assert.equal(hash.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects an invalid name before calling either dependency', async (context) => {
    const existsByName = context.mock.fn(async () => false);
    const save = context.mock.fn(async () => 'unexpected-id');
    const hash = context.mock.fn(async () => 'unexpected-hash');
    const useCase = new CreateUser({ existsByName, save }, { hash, match });

    await assert.rejects(
      useCase.create({ ...input, name: ' ' }),
      (error: unknown) => error instanceof DomainError && error.field === 'name',
    );
    assert.equal(existsByName.mock.callCount(), 0);
    assert.equal(hash.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('rejects invalid passwords before hashing or saving', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const hash = context.mock.fn(async () => 'unexpected-hash');
    const useCase = new CreateUser({ existsByName: async () => false, save }, { hash, match });
    const invalidPasswords: unknown[] = [
      undefined, null, false, 123, '', ' ', 'Abcdef1', 'abcdefgh', '12345678',
      'a'.repeat(73), 'á'.repeat(37),
    ];

    for (const password of invalidPasswords) {
      await assert.rejects(
        useCase.create({ ...input, password: password as string }),
        (error: unknown) => error instanceof DomainError && error.field === 'password',
      );
    }
    assert.equal(hash.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('does not hash or save when the lookup fails', async (context) => {
    const failure = new Error('Lookup failed');
    const save = context.mock.fn(async () => 'unexpected-id');
    const hash = context.mock.fn(async () => 'unexpected-hash');
    const useCase = new CreateUser({ existsByName: async () => { throw failure; }, save }, { hash, match });

    await assert.rejects(useCase.create(input), (error: unknown) => error === failure);
    assert.equal(hash.mock.callCount(), 0);
    assert.equal(save.mock.callCount(), 0);
  });

  it('does not save when the hashing gateway fails', async (context) => {
    const failure = new Error('Hashing failed');
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateUser({ existsByName: async () => false, save }, {
      match,
      hash: async () => { throw failure; },
    });

    await assert.rejects(useCase.create(input), (error: unknown) => error === failure);
    assert.equal(save.mock.callCount(), 0);
  });

  it('does not save when the hashing gateway returns an empty hash', async (context) => {
    const save = context.mock.fn(async () => 'unexpected-id');
    const useCase = new CreateUser({ existsByName: async () => false, save }, { hash: async () => '', match });

    await assert.rejects(
      useCase.create(input),
      (error: unknown) => error instanceof DomainError && error.field === 'password' && error.code === 'INVALID_HASH',
    );
    assert.equal(save.mock.callCount(), 0);
  });

  it('propagates save failures, including a duplicate found after the lookup', async () => {
    const failures = [
      new Error('Save failed'),
      new ApplicationError('name', 'ALREADY_EXISTS', 'Já existe um usuário cadastrado com esse nome.'),
    ];

    for (const failure of failures) {
      const useCase = new CreateUser({
        existsByName: async () => false,
        save: async () => { throw failure; },
      }, { hash: async () => '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', match });

      await assert.rejects(useCase.create(input), (error: unknown) => error === failure);
    }
  });
});
