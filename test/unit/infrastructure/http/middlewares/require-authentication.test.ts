import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { InfrastructureError } from '../../../../../src/infrastructure/errors/infrastructure-error.js';
import { JwtAuthTokenGateway } from '../../../../../src/infrastructure/gateways/jwt-auth-token-gateway.js';
import { RequireAuthentication } from '../../../../../src/infrastructure/http/middlewares/require-authentication.js';
import { createResponse } from '../../../../helpers/http-fixtures.js';
import type { UserRepository } from '../../../../../src/domain/repositories/user-repository.js';

describe('RequireAuthentication', () => {
  const gateway = new JwtAuthTokenGateway('a'.repeat(32));
  const users = { findRoleById: async (id: string) => id === 'user-1' ? 'EMPLOYEE' : null } as UserRepository;
  const middleware = new RequireAuthentication(gateway, users);

  it('allows a valid Bearer token from login', async (context) => {
    const token = await gateway.issue('user-1');
    const request = { header: () => `Bearer ${token}` } as unknown as Request;
    const { response } = createResponse(context);
    const next = context.mock.fn();

    await middleware.execute(request, response, next);

    assert.equal(response.locals.userId, 'user-1');
    assert.equal(response.locals.userRole, 'EMPLOYEE');
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
      assert.ok(error instanceof InfrastructureError);
      assert.equal(error.code, 'UNAUTHORIZED');
      assert.equal(error.field, 'authorization');
      assert.equal(response.locals.userId, undefined);
      assert.equal(response.locals.userRole, undefined);
    }
  });

  it('rejects a valid token after the user has been deleted', async (context) => {
    const token = await gateway.issue('deleted-user');
    const request = { header: () => `Bearer ${token}` } as unknown as Request;
    const { response } = createResponse(context);
    const next = context.mock.fn();

    await middleware.execute(request, response, next);

    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof InfrastructureError);
    assert.equal(error.code, 'UNAUTHORIZED');
    assert.equal(response.locals.userId, undefined);
    assert.equal(response.locals.userRole, undefined);
  });
});
