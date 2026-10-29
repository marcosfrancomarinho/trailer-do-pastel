import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { InfrastructureError } from '../../../../../src/infrastructure/errors/infrastructure-error.js';
import { RequireAdmin } from '../../../../../src/infrastructure/http/middlewares/require-admin.js';
import { createResponse } from '../../../../helpers/http-fixtures.js';

describe('RequireAdmin', () => {
  it('allows the administrator', (context) => {
    const { response } = createResponse(context);
    response.locals.userRole = 'ADMIN';
    const next = context.mock.fn();

    new RequireAdmin().execute({} as Request, response, next);

    assert.deepEqual(next.mock.calls[0].arguments, []);
  });

  it('rejects employees and requests without an administrator role', (context) => {
    for (const role of ['EMPLOYEE', undefined]) {
      const { response } = createResponse(context);
      response.locals.userRole = role;
      const next = context.mock.fn();

      new RequireAdmin().execute({} as Request, response, next);

      const error = next.mock.calls[0].arguments[0];
      assert.ok(error instanceof InfrastructureError);
      assert.equal(error.code, 'FORBIDDEN');
    }
  });
});
