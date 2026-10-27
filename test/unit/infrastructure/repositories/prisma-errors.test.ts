import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Prisma } from '@prisma/client';
import { isForeignKeyConstraintError } from '../../../../src/infrastructure/repositories/prisma-errors.js';

describe('Prisma foreign key error classification', () => {
  it('recognizes known Prisma foreign key violations', () => {
    assert.equal(isForeignKeyConstraintError(new Prisma.PrismaClientKnownRequestError('Foreign key',
      { code: 'P2003', clientVersion: '6' })), true);
  });
  for (const code of ['23001', '23503']) {
    it(`recognizes PostgreSQL connector violation ${code}`, () => {
      const error = new Prisma.PrismaClientUnknownRequestError(
        `ConnectorError(QueryError(PostgresError { code: "${code}", message: "constraint violation" }))`,
        { clientVersion: '6' });
      assert.equal(isForeignKeyConstraintError(error), true);
    });
  }
  it('does not misclassify unrelated database or application errors', () => {
    for (const error of [null, undefined, {}, new Error('PostgresError { code: "23001" }'),
      new Prisma.PrismaClientKnownRequestError('Unique key', { code: 'P2002', clientVersion: '6' }),
      new Prisma.PrismaClientUnknownRequestError('Connection lost', { clientVersion: '6' })]) {
      assert.equal(isForeignKeyConstraintError(error), false);
    }
  });
});
