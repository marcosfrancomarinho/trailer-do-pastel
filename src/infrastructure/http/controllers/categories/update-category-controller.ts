import type { NextFunction, Request, Response } from 'express';
import type { UpdateCategoryInput, UpdateCategoryOutput } from '../../../../application/dtos/categories/update-category-dto.js';
import { UpdateCategory } from '../../../../application/use-cases/categories/update-category.js';

export class UpdateCategoryController {
  public constructor(private readonly updateCategory: UpdateCategory) {}

  public async execute(request: Request, response: Response<UpdateCategoryOutput>, next: NextFunction): Promise<void> {
    try {
      const input: UpdateCategoryInput = {
        name: request.body?.name,
        categoryId: request.params.categoryId as string,
      };

      const output = await this.updateCategory.update(input);
      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
