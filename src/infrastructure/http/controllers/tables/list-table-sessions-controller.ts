import type { NextFunction, Request, Response } from 'express';
import type { ListTableSessionsOutput } from '../../../../application/dtos/tables/list-table-sessions-dto.js';
import { ListTableSessions } from '../../../../application/use-cases/tables/list-table-sessions.js';

export class ListTableSessionsController {
  public constructor(private listTableSessions: ListTableSessions) {}

  public async execute(
    request: Request<{ tableId: string }>,
    response: Response<ListTableSessionsOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { tableId } = request.params;
      const output = await this.listTableSessions.list({ tableId });

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
