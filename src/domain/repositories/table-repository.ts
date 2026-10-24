import type { Table } from '../entities/table.js';

export interface TableRepository {
  existsByNumber(number: number): Promise<boolean>;
  save(table: Table): Promise<string>;
  release(id: string): Promise<{ id: string; status: 'FREE'; totalSpent: string; sessionId: string; closedTotal: string }>;
}
