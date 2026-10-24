import type { NextFunction, Request, Response } from 'express';
import type { ReleaseTableOutput } from '../../../../application/dtos/tables/release-table-dto.js';
import { ReleaseTable } from '../../../../application/use-cases/tables/release-table.js';

export class ReleaseTableController {
  public constructor(private readonly releaseTable: ReleaseTable) {}

  public async execute(request: Request, response: Response<ReleaseTableOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.releaseTable.release({ tableId: request.params.tableId as string });
      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
