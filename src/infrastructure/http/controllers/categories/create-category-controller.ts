import type { NextFunction, Request, Response } from 'express';
import type { CreateCategoryInput, CreateCategoryOutput } from '../../../../application/dtos/categories/create-category-dto.js';
import { CreateCategory } from '../../../../application/use-cases/categories/create-category.js';

export class CreateCategoryController {
  public constructor(private createCategory: CreateCategory) {}

  public async execute(
    request: Request,
    response: Response<CreateCategoryOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input: CreateCategoryInput = { name: request.body?.name };
      const output = await this.createCategory.create(input);

      response.status(201).json(output);
    } catch (error) {
      next(error);
    }
  }
}
