import type { NextFunction, Request, Response } from 'express';
import type {
  ListClosedTableSessionsInput,
  ListClosedTableSessionsOutput,
} from '../../../../application/dtos/tables/list-closed-table-sessions-dto.js';
import { ListClosedTableSessions } from '../../../../application/use-cases/tables/list-closed-table-sessions.js';

export class ListClosedTableSessionsController {
  public constructor(private listClosedTableSessions: ListClosedTableSessions) {}

  public async execute(
    request: Request,
    response: Response<ListClosedTableSessionsOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rawDate = request.query.date;
      const date = typeof rawDate === 'string' ? rawDate : '';
      const input: ListClosedTableSessionsInput = { date };
      const output = await this.listClosedTableSessions.list(input);

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
