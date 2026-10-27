import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BcryptPasswordHasher } from '../src/infrastructure/gateways/bcrypt-password-hasher.js';

describe('BcryptPasswordHasher', () => {
  it('hashes a password with cost 12 and matches only the original password', async () => {
    const hasher = new BcryptPasswordHasher();
    const hash = await hasher.hash('Senha123');

    assert.match(hash, /^\$2[aby]\$12\$/);
    assert.notEqual(hash, 'Senha123');
    assert.equal(await hasher.match('Senha123', hash), true);
    assert.equal(await hasher.match('OutraSenha123', hash), false);
  });
});
