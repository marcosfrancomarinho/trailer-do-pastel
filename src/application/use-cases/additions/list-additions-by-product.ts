import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { ListAdditionsByProductInput, ListAdditionsByProductOutput } from '../../dtos/list-additions-by-product-dto.js';
import type { AdditionQueries } from '../../queries/addition-queries.js';

export class ListAdditionsByProduct {
  public constructor(private readonly additionQueries: AdditionQueries) {}

  public async list(input: ListAdditionsByProductInput): Promise<ListAdditionsByProductOutput> {
    const productId = ReferenceId.create(input.productId, 'productId');
    return this.additionQueries.findByProductId(productId.getValue());
  }
}
