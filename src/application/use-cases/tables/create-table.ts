import { EventObserver } from '../../observer/event-observer.js';
import { Table } from '../../../domain/entities/table.js';
import type { TableRepository } from '../../../domain/repositories/table-repository.js';
import { TableNumber } from '../../../domain/value-objects/table/table-number.js';
import { TableStatus } from '../../../domain/value-objects/table/table-status.js';
import type { CreateTableInput, CreateTableOutput } from '../../dtos/tables/create-table-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class CreateTable {
  public constructor(private tableRepository: TableRepository, private eventObserver: EventObserver) {}

  public async create(input: CreateTableInput): Promise<CreateTableOutput> {
    const number = TableNumber.create(input.number);
    const initialStatus = input.status === undefined ? 'FREE' : input.status;
    const status = TableStatus.create(initialStatus);
    const tableExists = await this.tableRepository.existsByNumber(number.getValue());

    if (tableExists) {
      throw new ApplicationError('number', 'ALREADY_EXISTS', 'Já existe uma mesa cadastrada com esse número.');
    }

    const table = Table.create(number, status);
    const id = await this.tableRepository.save(table);
    await this.eventObserver.notify({ type: 'TABLE_CREATED', tableId: id });

    return {
      id,
      status: table.getStatus(),
      totalSpent: table.getTotalSpent(),
    };
  }
}
