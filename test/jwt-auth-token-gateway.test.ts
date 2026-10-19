import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { JwtAuthTokenGateway } from '../src/infrastructure/gateways/jwt-auth-token-gateway.js';

describe('JwtAuthTokenGateway', () => {
  it('issues an HS256 token for the user with a one-hour expiration', async () => {
    const secret = 'a'.repeat(32);
    const gateway = new JwtAuthTokenGateway(secret);

    const token = await gateway.issue('user-1');
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });

    assert.equal(typeof payload, 'object');
    assert.equal(payload.sub, 'user-1');
    assert.equal(payload.exp! - payload.iat!, 3600);
    assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'sub']);
  });

  it('rejects secrets shorter than 32 bytes', () => {
    assert.throws(() => new JwtAuthTokenGateway('short'), /JWT_SECRET/);
    assert.throws(() => new JwtAuthTokenGateway(undefined), /JWT_SECRET/);
  });
});
