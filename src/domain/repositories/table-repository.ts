import type { Table } from '../entities/table.js';

export interface TableRepository {
  existsByNumber(number: number): Promise<boolean>;
  save(table: Table): Promise<string>;
  archive(id: string): Promise<void>;
  release(id: string): Promise<{ id: string; status: 'FREE'; totalSpent: string; sessionId: string; closedTotal: string }>;
}
