import { ReferenceId } from '../../domain/value-objects/shared/reference-id.js';
import type { ListProductsByCategoryInput, ListProductsByCategoryOutput } from '../dtos/list-products-by-category-dto.js';
import type { ProductQueries } from '../queries/product-queries.js';

export class ListProductsByCategory {
  public constructor(private readonly productQueries: ProductQueries) {}

  public async list(input: ListProductsByCategoryInput): Promise<ListProductsByCategoryOutput> {
    const categoryId = ReferenceId.create(input.categoryId, 'categoryId');
    return this.productQueries.findByCategoryId(categoryId.getValue());
  }
}
