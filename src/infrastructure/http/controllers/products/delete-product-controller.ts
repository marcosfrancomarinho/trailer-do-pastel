import type { NextFunction, Request, Response } from 'express';
import { DeleteProduct } from '../../../../application/use-cases/products/delete-product.js';

export class DeleteProductController {
  public constructor(private readonly deleteProduct: DeleteProduct) {}

  public async execute(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      await this.deleteProduct.delete({ productId: request.params.productId as string });
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
