import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { JwtAuthTokenGateway } from '../../../../src/infrastructure/gateways/jwt-auth-token-gateway.js';
import { InfrastructureError } from '../../../../src/infrastructure/errors/infrastructure-error.js';

describe('JwtAuthTokenGateway', () => {
  it('issues an HS256 token for the user without an expiration time', async () => {
    const secret = 'a'.repeat(32);
    const gateway = new JwtAuthTokenGateway(secret);

    const token = await gateway.issue('user-1');
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

    assert.equal(typeof payload, 'object');
    assert.equal(payload.sub, 'user-1');
    assert.equal(payload.exp, undefined);
    assert.deepEqual(Object.keys(payload).sort(), ['iat', 'sub']);
    assert.equal(await gateway.verify(token), 'user-1');
  });

  it('rejects tampered, expired, and incorrectly signed tokens', async () => {
    const secret = 'a'.repeat(32);
    const gateway = new JwtAuthTokenGateway(secret);
    const validToken = await gateway.issue('user-1');
    const expiredToken = jwt.sign({}, secret, { algorithm: 'HS256', subject: 'user-1', expiresIn: -1 });
    const otherSecretToken = jwt.sign({}, 'b'.repeat(32), { algorithm: 'HS256', subject: 'user-1' });

    assert.equal(await gateway.verify(validToken.slice(0, -1) + 'x'), null);
    assert.equal(await gateway.verify(expiredToken), null);
    assert.equal(await gateway.verify(otherSecretToken), null);
    assert.equal(await gateway.verify('malformed'), null);
  });

  it('rejects secrets shorter than 32 bytes', () => {
    for (const secret of ['short', undefined]) {
      assert.throws(() => new JwtAuthTokenGateway(secret), (error: unknown) =>
        error instanceof InfrastructureError
          && error.field === 'JWT_SECRET'
          && error.code === 'INVALID_CONFIGURATION');
    }
  });
});
