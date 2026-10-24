import type { ReleaseTableInput, ReleaseTableOutput } from '../../dtos/tables/release-table-dto.js';
import type { TableRepository } from '../../../domain/repositories/table-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';

export class ReleaseTable {
  public constructor(private readonly tableRepository: TableRepository) {}

  public async release(input: ReleaseTableInput): Promise<ReleaseTableOutput> {
    const tableId = ReferenceId.create(input.tableId, 'tableId').getValue();
    return this.tableRepository.release(tableId);
  }
}
