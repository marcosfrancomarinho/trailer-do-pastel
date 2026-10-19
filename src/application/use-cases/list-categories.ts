import type { ListCategoriesOutput } from '../dtos/list-categories-dto.js';
import type { CategoryQueries } from '../queries/category-queries.js';

export class ListCategories {
  public constructor(private readonly categoryQueries: CategoryQueries) {}

  public async list(): Promise<ListCategoriesOutput> {
    return this.categoryQueries.findAll();
  }
}
