import type { NextFunction, Request, Response } from 'express';
import type { ListProductsOutput } from '../../../../application/dtos/list-products-dto.js';
import { ListProducts } from '../../../../application/use-cases/products/list-products.js';

export class ListProductsController {
  public constructor(private readonly listProducts: ListProducts) {}

  public async execute(_request: Request, response: Response<ListProductsOutput>, next: NextFunction): Promise<void> {
    try {
      const output = await this.listProducts.list();

      response.status(200);
      response.json(output);
    } catch (error) {
      next(error);
    }
  }
}
