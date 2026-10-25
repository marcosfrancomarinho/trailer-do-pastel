import type { NextFunction, Request, Response } from 'express';
import type { ListTablesOutput } from '../../../../application/dtos/tables/list-tables-dto.js';
import { ListTables } from '../../../../application/use-cases/tables/list-tables.js';

export class ListTablesController {
  public constructor(private listTables: ListTables) {}

  public async execute(_request: Request, response: Response<ListTablesOutput>, next: NextFunction): Promise<void> {
    try {
      response.status(200).json(await this.listTables.list());
    } catch (error) {
      next(error);
    }
  }
}
