import type { NextFunction, Request, Response } from 'express';
import { ListClosedTableSessions } from '../../../../application/use-cases/tables/list-closed-table-sessions.js';
import type { ListClosedTableSessionsOutput } from '../../../../application/dtos/tables/list-closed-table-sessions-dto.js';

export class ListClosedTableSessionsController {
  public constructor(private readonly useCase: ListClosedTableSessions) {}

  public async execute(request: Request, response: Response<ListClosedTableSessionsOutput>, next: NextFunction): Promise<void> {
    try {
      const rawDate = request.query.date;
      const date = rawDate === undefined ? undefined : typeof rawDate === 'string' ? rawDate : '';
      response.status(200).json(await this.useCase.list(date));
    } catch (error) {
      next(error);
    }
  }
}
