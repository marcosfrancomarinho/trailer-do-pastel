import type { NextFunction, Request, Response } from 'express';
import { DeleteCategory } from '../../../../application/use-cases/categories/delete-category.js';

export class DeleteCategoryController {
  public constructor(private deleteCategory: DeleteCategory) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.deleteCategory.delete({ categoryId: request.params.categoryId as string });
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
