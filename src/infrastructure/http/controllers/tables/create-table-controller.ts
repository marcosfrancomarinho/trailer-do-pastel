import type { NextFunction, Request, Response } from 'express';
import type { CreateTableInput, CreateTableOutput } from '../../../../application/dtos/tables/create-table-dto.js';
import { CreateTable } from '../../../../application/use-cases/tables/create-table.js';

export class CreateTableController {
  public constructor(private createTable: CreateTable) {}

  public async execute(
    request: Request,
    response: Response<CreateTableOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { number, status } = request.body ?? {};
      const input: CreateTableInput = { number };

      if (status !== undefined) {
        input.status = status;
      }

      const output = await this.createTable.create(input);

      response.status(201).json(output);
    } catch (error) {
      next(error);
    }
  }
}
