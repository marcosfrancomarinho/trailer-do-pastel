import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LoginUser } from '../src/application/use-cases/users/login-user.js';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { DomainError } from '../src/domain/errors/domain-error.js';
import { User } from '../src/domain/entities/user.js';
import { UserName } from '../src/domain/value-objects/user/user-name.js';
import { UserPassword } from '../src/domain/value-objects/user/user-password.js';

describe('LoginUser', () => {
  const hash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const user = User.create(UserName.create('Marcos'), UserPassword.fromHash(hash), 'user-1');
  const input = { name: ' Marcos ', password: '  Senha de teste1!  ' };
  const unusedRepositoryMethods = {
    existsByName: async () => false,
    save: async () => 'unused',
  };
  const unusedVerify = async () => null;

  it('checks the exact password and issues a token for the persisted user ID', async (context) => {
    const calls: string[] = [];
    const findByName = context.mock.fn(async (name: string) => {
      calls.push('find');
      assert.equal(name, 'Marcos');
      return user;
    });
    const match = context.mock.fn(async (password: string, savedHash: string) => {
      calls.push('match');
      assert.equal(password, input.password);
      assert.equal(savedHash, hash);
      return true;
    });
    const issue = context.mock.fn(async (userId: string) => {
      calls.push('issue');
      assert.equal(userId, 'user-1');
      return 'signed-token';
    });
    const useCase = new LoginUser(
      { ...unusedRepositoryMethods, findByName },
      { hash: async () => 'unused', match },
      { issue, verify: unusedVerify },
    );

    assert.deepEqual(await useCase.login(input), { name: 'Marcos', accessToken: 'signed-token' });
    assert.deepEqual(calls, ['find', 'match', 'issue']);
  });

  it('uses the same error for an unknown user and an incorrect password without issuing a token', async (context) => {
    const issue = context.mock.fn(async () => 'unexpected-token');
    const match = context.mock.fn(async () => false);

    for (const foundUser of [null, user]) {
      const useCase = new LoginUser(
        { ...unusedRepositoryMethods, findByName: async () => foundUser },
        { hash: async () => 'unused', match },
        { issue, verify: unusedVerify },
      );

      await assert.rejects(
        useCase.login(input),
        (error: unknown) => error instanceof ApplicationError
          && error.field === 'credentials'
          && error.code === 'INVALID_CREDENTIALS'
          && error.message === 'Nome ou senha inválidos.',
      );
    }

    assert.equal(match.mock.callCount(), 1);
    assert.equal(issue.mock.callCount(), 0);
  });

  it('rejects invalid input before querying the user', async (context) => {
    const findByName = context.mock.fn(async () => user);
    const match = context.mock.fn(async () => true);
    const issue = context.mock.fn(async () => 'unexpected-token');
    const useCase = new LoginUser(
      { ...unusedRepositoryMethods, findByName },
      { hash: async () => 'unused', match },
      { issue, verify: unusedVerify },
    );

    for (const invalidInput of [
      { ...input, name: ' ' },
      { ...input, password: '' },
      { ...input, password: 'too-short' },
    ]) {
      await assert.rejects(
        useCase.login(invalidInput),
        (error: unknown) => error instanceof DomainError,
      );
    }

    assert.equal(findByName.mock.callCount(), 0);
    assert.equal(match.mock.callCount(), 0);
    assert.equal(issue.mock.callCount(), 0);
  });

  it('propagates token gateway failures', async () => {
    const failure = new Error('Token signing failed');
    const useCase = new LoginUser(
      { ...unusedRepositoryMethods, findByName: async () => user },
      { hash: async () => 'unused', match: async () => true },
      { issue: async () => { throw failure; }, verify: unusedVerify },
    );

    await assert.rejects(useCase.login(input), (error: unknown) => error === failure);
  });
});
