import { PrismaClient } from '@prisma/client';
import type { ListTablesOutput } from '../../application/dtos/tables/list-tables-dto.js';
import type { TableQueries } from '../../application/queries/table-queries.js';

export class PrismaTableQueries implements TableQueries {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(): Promise<ListTablesOutput> {
    const tables = await this.prisma.table.findMany({
      where: { deletedAt: null },
      select: { id: true, number: true, status: true, totalSpent: true },
      orderBy: [{ number: 'asc' }, { id: 'asc' }],
    });
    return tables.map((table) => ({
      id: table.id,
      number: table.number,
      status: table.status,
      totalSpent: table.totalSpent.toString(),
    }));
  }
}
