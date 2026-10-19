import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { RequireAdmin } from '../src/infrastructure/http/middlewares/require-admin.js';
import { createResponse } from './helpers/http-fixtures.js';

describe('RequireAdmin', () => {
  it('allows only configured user IDs', (context) => {
    const middleware = new RequireAdmin(' admin-1, admin-2 ');
    const { response } = createResponse(context);
    response.locals.userId = 'admin-2';
    const next = context.mock.fn();

    middleware.execute({} as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, []);
  });

  it('rejects unlisted users and denies everyone when no IDs are configured', (context) => {
    for (const [configuredIds, userId] of [['admin-1', 'other-user'], [undefined, 'admin-1'], ['admin-1', undefined]] as const) {
      const middleware = new RequireAdmin(configuredIds);
      const { response } = createResponse(context);
      response.locals.userId = userId;
      const next = context.mock.fn();

      middleware.execute({} as Request, response, next);

      const error = next.mock.calls[0].arguments[0];
      assert.ok(error instanceof ApplicationError);
      assert.equal(error.code, 'FORBIDDEN');
      assert.equal(error.field, 'authorization');
    }
  });
});
