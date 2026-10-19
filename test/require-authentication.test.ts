import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { JwtAuthTokenGateway } from '../src/infrastructure/gateways/jwt-auth-token-gateway.js';
import { RequireAuthentication } from '../src/infrastructure/http/middlewares/require-authentication.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('RequireAuthentication', () => {
  const gateway = new JwtAuthTokenGateway('a'.repeat(32));
  const middleware = new RequireAuthentication(gateway);

  it('allows a valid Bearer token from login', async (context) => {
    const token = await gateway.issue('user-1');
    const request = { header: () => `Bearer ${token}` } as unknown as Request;
    const { response } = createResponse(context);
    const next = context.mock.fn();

    await middleware.execute(request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, []);
  });

  it('rejects missing, malformed, expired, and incorrectly signed tokens', async (context) => {
    const expiredToken = jwt.sign({}, 'a'.repeat(32), { algorithm: 'HS256', subject: 'user-1', expiresIn: -1 });
    const otherSecretToken = await new JwtAuthTokenGateway('b'.repeat(32)).issue('user-1');

    for (const authorization of [undefined, 'Basic abc', 'Bearer ', 'Bearer malformed', `Bearer ${expiredToken}`, `Bearer ${otherSecretToken}`]) {
      const request = { header: () => authorization } as unknown as Request;
      const { response } = createResponse(context);
      const next = context.mock.fn();

      await middleware.execute(request, response, next);

      const error = next.mock.calls[0].arguments[0];
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'UNAUTHORIZED');
      assert.equal(error.field, 'authorization');
    }
  });
});
