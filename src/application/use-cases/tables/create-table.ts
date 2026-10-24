import type { CreateTableInput, CreateTableOutput } from '../../dtos/tables/create-table-dto.js';
import { ApplicationError } from '../../errors/application-error.js';
import { Table } from '../../../domain/entities/table.js';
import type { TableRepository } from '../../../domain/repositories/table-repository.js';
import { TableNumber } from '../../../domain/value-objects/table/table-number.js';
import { TableStatus } from '../../../domain/value-objects/table/table-status.js';

export class CreateTable {
  public constructor(private readonly tableRepository: TableRepository) {}

  public async create(input: CreateTableInput): Promise<CreateTableOutput> {
    const number = TableNumber.create(input.number);
    const status = TableStatus.create(input.status === undefined ? 'FREE' : input.status);

    if (await this.tableRepository.existsByNumber(number.getValue())) {
      throw new ApplicationError('number', 'ALREADY_EXISTS', 'Já existe uma mesa cadastrada com esse número.');
    }

    const table = Table.create(number, status);
    const id = await this.tableRepository.save(table);
    return { id, status: table.getStatus(), totalSpent: table.getTotalSpent() };
  }
}
