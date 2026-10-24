import type { NextFunction, Request, Response } from 'express';
import { DeleteTable } from '../../../../application/use-cases/tables/delete-table.js';

export class DeleteTableController {
  public constructor(private readonly deleteTable: DeleteTable) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.deleteTable.delete({ tableId: request.params.tableId as string });
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
