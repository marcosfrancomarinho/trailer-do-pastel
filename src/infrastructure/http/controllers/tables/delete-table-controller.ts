import type { NextFunction, Request, Response } from 'express';
import { DeleteTable } from '../../../../application/use-cases/tables/delete-table.js';

export class DeleteTableController {
  public constructor(private deleteTable: DeleteTable) {}

  public async execute(
    request: Request<{ tableId: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tableId } = request.params;

      await this.deleteTable.delete({ tableId });

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
