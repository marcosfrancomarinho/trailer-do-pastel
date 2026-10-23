import type { ListAdditionsOutput } from '../../dtos/additions/list-additions-dto.js';
import type { AdditionQueries } from '../../queries/addition-queries.js';

export class ListAdditions {
  public constructor(private readonly additionQueries: AdditionQueries) {}

  public async list(): Promise<ListAdditionsOutput> {
    return this.additionQueries.findAll();
  }
}
