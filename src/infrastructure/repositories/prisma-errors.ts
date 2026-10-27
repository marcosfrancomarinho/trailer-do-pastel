import { Prisma } from '@prisma/client';

export function isForeignKeyConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return error.code === 'P2003';
  // Prisma 6 can expose PostgreSQL RESTRICT errors as an unknown connector error.
  return error instanceof Prisma.PrismaClientUnknownRequestError
    && /PostgresError\s*\{\s*code:\s*"(?:23001|23503)"/.test(error.message);
}
