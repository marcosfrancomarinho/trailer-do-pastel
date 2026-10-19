import type { Response } from 'express';
import type { TestContext } from 'node:test';

export function createResponse(context: TestContext, headersSent: boolean = false) {
  const response = {} as Response;
  const status = context.mock.fn((_status: number) => response);
  const json = context.mock.fn((_body: unknown) => response);

  response.status = status;
  response.json = json;
  response.locals = {};
  Object.defineProperty(response, 'headersSent', { value: headersSent });

  return { response, status, json };
}
