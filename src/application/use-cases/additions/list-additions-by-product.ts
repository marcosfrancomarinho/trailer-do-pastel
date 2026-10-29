import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { ListAdditionsByProductInput, ListAdditionsByProductOutput } from '../../dtos/additions/list-additions-by-product-dto.js';
import type { AdditionQueries } from '../../queries/addition-queries.js';

export class ListAdditionsByProduct {
  public constructor(private additions: AdditionQueries) {}

  public async list(input: ListAdditionsByProductInput): Promise<ListAdditionsByProductOutput> {
    const productId: ReferenceId = ReferenceId.create(input.productId, 'productId');
    return this.additions.findByProductId(productId.getValue());
  }
}
