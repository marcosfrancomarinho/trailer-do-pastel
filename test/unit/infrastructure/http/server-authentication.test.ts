import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { ApplicationError } from '../../../../src/application/errors/application-error.js';
import { JwtAuthTokenGateway } from '../../../../src/infrastructure/gateways/jwt-auth-token-gateway.js';
import { ErrorHandler } from '../../../../src/infrastructure/http/middlewares/error-handler.js';
import { RequireAuthentication } from '../../../../src/infrastructure/http/middlewares/require-authentication.js';
import { RequireAdmin } from '../../../../src/infrastructure/http/middlewares/require-admin.js';
import { Server } from '../../../../src/infrastructure/http/server.js';
import { createResponse } from '../../../helpers/http-fixtures.js';
import type { UserRepository } from '../../../../src/domain/repositories/user-repository.js';

interface RouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: { handle: (request: Request, response: Response, next: (error?: unknown) => void) => unknown }[];
  };
}

describe('Server authentication', () => {
  it('requires a Bearer token for management routes and keeps customer routes public', async (context) => {
    const gateway = new JwtAuthTokenGateway('a'.repeat(32));
    const controller = { execute() {}, getStatus() {}, open() {}, close() {} };
    const dependencies = [
      ...Array.from({ length: Server.length - 3 }, () => controller),
      new RequireAuthentication(gateway, { findRoleById: async () => 'EMPLOYEE' } as UserRepository),
      new RequireAdmin(),
      new ErrorHandler(),
    ] as unknown as ConstructorParameters<typeof Server>;
    const server = new Server(...dependencies);
    const app = (server as unknown as { app: { router: { stack: RouteLayer[] } } }).app;
    const routes = app.router.stack.filter((layer) => layer.route);
    const findRoute = (method: string, path: string) => routes.find((layer) =>
      layer.route?.path === path && layer.route.methods[method.toLowerCase()]);

    const adminRoutes = [
      ['POST', '/users'],
      ['GET', '/users'],
      ['DELETE', '/users/:userId'],
      ['POST', '/products'],
      ['PATCH', '/products/:productId'],
      ['DELETE', '/products/:productId'],
      ['POST', '/additions'],
      ['PATCH', '/additions/:additionId'],
      ['DELETE', '/additions/:additionId'],
      ['POST', '/categories'],
      ['PATCH', '/categories/:categoryId'],
      ['DELETE', '/categories/:categoryId'],
      ['GET', '/tables/sessions/history'],
      ['POST', '/store/open'],
      ['POST', '/store/close'],
    ] as const;

    for (const [method, path] of adminRoutes) {
      assert.equal(findRoute(method, path)?.route?.stack.length, 3, `${method} ${path} deve exigir administrador`);
    }

    const protectedRoutes = [
      ['POST', '/tables'],
      ['DELETE', '/tables/:tableId'],
      ['GET', '/tables'],
      ['GET', '/tables/:tableId/orders'],
      ['GET', '/tables/:tableId/sessions'],
      ['DELETE', '/tables/:tableId/orders/:orderId'],
      ['PATCH', '/tables/:tableId/release'],
      ['PATCH', '/orders/:orderId/status'],
      ['GET', '/orders/pending'],
      ['GET', '/orders/preparing'],
      ['GET', '/orders/history'],
    ] as const;

    for (const [method, path] of protectedRoutes) {
      assert.equal(findRoute(method, path)?.route?.stack.length, 2, `${method} ${path} deve exigir autenticação`);
    }

    const publicRoutes = [
      ['POST', '/login'],
      ['GET', '/products'],
      ['GET', '/products/:productId/additions'],
      ['GET', '/additions'],
      ['GET', '/categories'],
      ['GET', '/categories/:categoryId/products'],
      ['GET', '/orders/tracking/:trackingToken'],
      ['GET', '/store/status'],
    ] as const;

    for (const [method, path] of publicRoutes) {
      assert.equal(findRoute(method, path)?.route?.stack.length, 1, `${method} ${path} deve ser público`);
    }

    assert.equal(findRoute('POST', '/orders')?.route?.stack.length, 2);
    assert.equal(routes.length, adminRoutes.length + protectedRoutes.length + publicRoutes.length + 1);

    const middleware = findRoute('GET', '/orders/pending')?.route?.stack[0].handle;
    assert.ok(middleware);
    const { response } = createResponse(context);
    const next = context.mock.fn();

    await middleware({ header: () => undefined } as unknown as Request, response, next);
    const error = next.mock.calls[0].arguments[0];
    assert.ok(error instanceof ApplicationError);
    assert.equal(error.code, 'UNAUTHORIZED');

    const token = await gateway.issue('user-1');
    const authorized = { header: () => `Bearer ${token}` } as unknown as Request;
    await middleware(authorized, response, next);
    assert.equal(response.locals.userId, 'user-1');
    assert.equal(response.locals.userRole, 'EMPLOYEE');
    assert.deepEqual(next.mock.calls[1].arguments, []);

    for (const [method, path] of [['POST', '/tables'], ['DELETE', '/tables/:tableId']] as const) {
      const tableMiddleware = findRoute(method, path)?.route?.stack[0].handle;
      assert.ok(tableMiddleware);
      const tableNext = context.mock.fn();
      const { response: tableResponse } = createResponse(context);
      await tableMiddleware(authorized, tableResponse, tableNext);
      assert.equal(tableResponse.locals.userRole, 'EMPLOYEE');
      assert.deepEqual(tableNext.mock.calls[0].arguments, []);
    }

    const orderGuard = findRoute('POST', '/orders')?.route?.stack[0].handle;
    assert.ok(orderGuard);
    const orderNext = context.mock.fn();

    await orderGuard({ body: {}, header: () => undefined } as unknown as Request, response, orderNext);
    await orderGuard({ body: { tableId: null }, header: () => undefined } as unknown as Request, response, orderNext);
    assert.deepEqual(orderNext.mock.calls[0].arguments, []);
    assert.deepEqual(orderNext.mock.calls[1].arguments, []);

    await orderGuard({ body: { tableId: 'table-1' }, header: () => undefined } as unknown as Request, response, orderNext);
    const tableOrderError = orderNext.mock.calls[2].arguments[0];
    assert.ok(tableOrderError instanceof ApplicationError);
    assert.equal(tableOrderError.code, 'UNAUTHORIZED');

    await orderGuard({ body: { tableId: 'table-1' }, header: () => `Bearer ${token}` } as unknown as Request,
      response, orderNext);
    assert.deepEqual(orderNext.mock.calls[3].arguments, []);
  });
});
