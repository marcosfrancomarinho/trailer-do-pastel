import type { TableRepository } from '../../../domain/repositories/table-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteTableInput } from '../../dtos/tables/delete-table-dto.js';

export class DeleteTable {
  public constructor(private tableRepository: TableRepository) {}

  public async delete(input: DeleteTableInput): Promise<void> {
    const tableId = ReferenceId.create(input.tableId, 'tableId');
    await this.tableRepository.archive(tableId.getValue());
  }
}
