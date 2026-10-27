import type { NextFunction, Request, Response } from 'express';
import { DeleteProduct } from '../../../../application/use-cases/products/delete-product.js';

export class DeleteProductController {
  public constructor(private deleteProduct: DeleteProduct) {}

  public async execute(
    request: Request<{ productId: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productId } = request.params;

      await this.deleteProduct.delete({ productId });

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
