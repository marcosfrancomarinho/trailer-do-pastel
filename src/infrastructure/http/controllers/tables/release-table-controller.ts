import type { NextFunction, Request, Response } from 'express';
import type { ReleaseTableOutput } from '../../../../application/dtos/tables/release-table-dto.js';
import { ReleaseTable } from '../../../../application/use-cases/tables/release-table.js';

export class ReleaseTableController {
  public constructor(private releaseTable: ReleaseTable) {}

  public async execute(
    request: Request<{ tableId: string }>,
    response: Response<ReleaseTableOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tableId } = request.params;
      const output = await this.releaseTable.release({ tableId });

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
