import type { ListProductsOutput } from '../../dtos/products/list-products-dto.js';
import type { ProductQueries } from '../../queries/product-queries.js';

export class ListProducts {
  public constructor(private readonly productQueries: ProductQueries) {}

  public async list(): Promise<ListProductsOutput> {
    return this.productQueries.findAll();
  }
}
