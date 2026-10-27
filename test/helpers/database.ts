import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const execute = promisify(execFile);
const require = createRequire(import.meta.url);

/** Every suite owns a fresh schema; existing application tables are never reset. */
export async function createTestDatabase(suite: 'integration' | 'e2e') {
  const connection = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connection) throw new Error('Set TEST_DATABASE_URL to a PostgreSQL database before running database tests.');
  const url = new URL(connection);
  if (!['postgresql:', 'postgres:'].includes(url.protocol)) throw new Error('Database tests require PostgreSQL.');
  const schema = `test_${suite}_${randomUUID().replaceAll('-', '')}`;
  url.searchParams.set('schema', schema);
  const databaseUrl = url.toString();
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  let created = false;

  const close = async () => {
    try {
      if (created) {
        if (!/^test_(integration|e2e)_[a-f0-9]{32}$/.test(schema)) throw new Error('Refusing to drop a non-test schema.');
        await prisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
        created = false;
      }
    } finally {
      await prisma.$disconnect();
    }
  };

  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    created = true;
    const prismaPackage = require.resolve('prisma/package.json');
    const cli = resolve(dirname(prismaPackage), require(prismaPackage).bin.prisma);
    await execute(process.execPath, [cli, 'migrate', 'deploy'], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl }, timeout: 60_000,
    });
    return { prisma, databaseUrl, schema, close };
  } catch (error) {
    await close();
    throw error;
  }
}

/** Deletes rows only from the randomly generated test schema. */
export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  const [current] = await prisma.$queryRaw<Array<{ schema: string }>>`SELECT current_schema() AS schema`;
  if (!current || !/^test_(integration|e2e)_[a-f0-9]{32}$/.test(current.schema)) {
    throw new Error('Refusing to reset a non-test schema.');
  }
  await prisma.$transaction([
    prisma.order.deleteMany(), prisma.tableSession.deleteMany(), prisma.table.deleteMany(),
    prisma.product.deleteMany(), prisma.addition.deleteMany(), prisma.category.deleteMany(),
    prisma.user.deleteMany(), prisma.store.deleteMany(),
  ]);
  await prisma.store.create({ data: { id: 1, status: 'OPEN' } });
}

export async function seedCatalog(prisma: PrismaClient) {
  const category = await prisma.category.create({ data: { name: 'Pasteis' } });
  const addition = await prisma.addition.create({ data: { name: 'Queijo extra', price: '0.20' } });
  const product = await prisma.product.create({ data: {
    name: 'Pastel de queijo', description: 'Preparado na hora', price: '0.10', categoryId: category.id,
    additions: { create: { additionId: addition.id } },
  } });
  return { category, addition, product };
}
