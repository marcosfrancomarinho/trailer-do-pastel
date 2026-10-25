import type { NextFunction, Request, Response } from 'express';
import type { CreateProductInput, CreateProductOutput } from '../../../../application/dtos/products/create-product-dto.js';
import { CreateProduct } from '../../../../application/use-cases/products/create-product.js';

export class CreateProductController {
  public constructor(private createProduct: CreateProduct) {}

  public async execute(request: Request, response: Response<CreateProductOutput>, next: NextFunction): Promise<void> {
    try {
      const input: CreateProductInput = {
        name: request.body?.name,
        description: request.body?.description,
        categoryId: request.body?.categoryId,
        price: request.body?.price,
        imageUrl: request.body?.imageUrl,
        available: request.body?.available,
        additionIds: request.body?.additionIds,
      };

      const output = await this.createProduct.create(input);

      response.status(201).json(output);
    } catch (error) {
      next(error);
    }
  }
}
