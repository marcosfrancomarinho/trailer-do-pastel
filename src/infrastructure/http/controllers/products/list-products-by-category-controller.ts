import type { NextFunction, Request, Response } from 'express';
import type {
  ListProductsByCategoryInput,
  ListProductsByCategoryOutput,
} from '../../../../application/dtos/products/list-products-by-category-dto.js';
import { ListProductsByCategory } from '../../../../application/use-cases/products/list-products-by-category.js';

export class ListProductsByCategoryController {
  public constructor(private listProductsByCategory: ListProductsByCategory) {}

  public async execute(
    request: Request<{ categoryId: string }>,
    response: Response<ListProductsByCategoryOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryId } = request.params;

      const input: ListProductsByCategoryInput = { categoryId };
      const output = await this.listProductsByCategory.list(input);

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
