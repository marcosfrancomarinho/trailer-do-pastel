import type { NextFunction, Request, Response } from 'express';
import type { UpdateProductInput, UpdateProductOutput } from '../../../../application/dtos/products/update-product-dto.js';
import { UpdateProduct } from '../../../../application/use-cases/products/update-product.js';

export class UpdateProductController {
  public constructor(private updateProduct: UpdateProduct) {}

  public async execute(
    request: Request<{ productId: string }>,
    response: Response<UpdateProductOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productId } = request.params;

      const input: UpdateProductInput = {
        productId,
        name: request.body?.name,
        description: request.body?.description,
        categoryId: request.body?.categoryId,
        price: request.body?.price,
        imageUrl: request.body?.imageUrl,
        available: request.body?.available,
        additionIds: request.body?.additionIds,
      };

      const output = await this.updateProduct.update(input);

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
