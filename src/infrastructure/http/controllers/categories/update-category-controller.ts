import type { NextFunction, Request, Response } from 'express';
import type { UpdateCategoryInput, UpdateCategoryOutput } from '../../../../application/dtos/categories/update-category-dto.js';
import { UpdateCategory } from '../../../../application/use-cases/categories/update-category.js';

export class UpdateCategoryController {
  public constructor(private updateCategory: UpdateCategory) {}

  public async execute(
    request: Request<{ categoryId: string }>,
    response: Response<UpdateCategoryOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categoryId: string = request.params.categoryId;
      const sortOrder: number | undefined = request.body?.sortOrder;
      const name: string = request.body?.name;

      const input: UpdateCategoryInput = {
        name,
        categoryId,
      };

      if (sortOrder !== undefined) {
        input.sortOrder = sortOrder;
      }

      const output: UpdateCategoryOutput = await this.updateCategory.update(input);

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
