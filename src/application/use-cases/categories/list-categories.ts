import type { ListCategoriesOutput } from '../../dtos/categories/list-categories-dto.js';
import type { CategoryQueries } from '../../queries/category-queries.js';

export class ListCategories {
  public constructor(private categories: CategoryQueries) {}

  public async list(): Promise<ListCategoriesOutput> {
    return this.categories.findAll();
  }
}
