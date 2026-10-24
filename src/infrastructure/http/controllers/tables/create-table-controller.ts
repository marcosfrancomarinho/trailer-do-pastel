import type { NextFunction, Request, Response } from 'express';
import type { CreateTableInput, CreateTableOutput } from '../../../../application/dtos/tables/create-table-dto.js';
import { CreateTable } from '../../../../application/use-cases/tables/create-table.js';

export class CreateTableController {
  public constructor(private readonly createTable: CreateTable) {}

  public async execute(request: Request, response: Response<CreateTableOutput>, next: NextFunction): Promise<void> {
    try {
      const input: CreateTableInput = {
        number: request.body?.number,
        ...(request.body?.status !== undefined ? { status: request.body.status } : {}),
      };
      const output = await this.createTable.create(input);
      response.status(201);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
