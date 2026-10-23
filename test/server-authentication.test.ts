import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response } from 'express';
import { ApplicationError } from '../src/application/errors/application-error.js';
import { JwtAuthTokenGateway } from '../src/infrastructure/gateways/jwt-auth-token-gateway.js';
import { ErrorHandler } from '../src/infrastructure/http/middlewares/error-handler.js';
import { RequireAuthentication } from '../src/infrastructure/http/middlewares/require-authentication.js';
import { Server } from '../src/infrastructure/http/server.js';
import { createResponse } from './helpers/http-fixtures.js';

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
    const controller = { execute() {} };
    const dependencies = [
      ...Array.from({ length: Server.length - 2 }, () => controller),
      new RequireAuthentication(gateway),
      new ErrorHandler(),
    ] as unknown as ConstructorParameters<typeof Server>;
    const server = new Server(...dependencies);
    const app = (server as unknown as { app: { router: { stack: RouteLayer[] } } }).app;
    const routes = app.router.stack.filter((layer) => layer.route);
    const findRoute = (method: string, path: string) => routes.find((layer) =>
      layer.route?.path === path && layer.route.methods[method.toLowerCase()]);

    const protectedRoutes = [
      ['POST', '/users'],
      ['POST', '/products'],
      ['PATCH', '/products/:productId'],
      ['DELETE', '/products/:productId'],
      ['POST', '/additions'],
      ['PATCH', '/additions/:additionId'],
      ['DELETE', '/additions/:additionId'],
      ['POST', '/categories'],
      ['PATCH', '/categories/:categoryId'],
      ['DELETE', '/categories/:categoryId'],
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
      ['POST', '/orders'],
      ['GET', '/orders/tracking/:trackingToken'],
    ] as const;

    for (const [method, path] of publicRoutes) {
      assert.equal(findRoute(method, path)?.route?.stack.length, 1, `${method} ${path} deve ser público`);
    }

    assert.equal(routes.length, protectedRoutes.length + publicRoutes.length);

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
    assert.deepEqual(next.mock.calls[1].arguments, []);
  });
});
