import type { ReleaseTableOutput } from '../../application/dtos/tables/release-table-dto.js';
import type { Table } from '../entities/table.js';

export interface TableRepository {
  existsByNumber(number: number): Promise<boolean>;
  save(table: Table): Promise<string>;
  archive(id: string): Promise<void>;
  release(id: string): Promise<ReleaseTableOutput>;
}
