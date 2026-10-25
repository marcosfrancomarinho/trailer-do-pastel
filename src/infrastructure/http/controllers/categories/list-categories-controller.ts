import type { NextFunction, Request, Response } from 'express';
import type { ListCategoriesOutput } from '../../../../application/dtos/categories/list-categories-dto.js';
import { ListCategories } from '../../../../application/use-cases/categories/list-categories.js';

export class ListCategoriesController {
  public constructor(private listCategories: ListCategories) {}

  public async execute(_request: Request, response: Response<ListCategoriesOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.listCategories.list();

      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
