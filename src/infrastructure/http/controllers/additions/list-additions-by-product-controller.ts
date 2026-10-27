import type { NextFunction, Request, Response } from 'express';
import type {
  ListAdditionsByProductInput,
  ListAdditionsByProductOutput,
} from '../../../../application/dtos/additions/list-additions-by-product-dto.js';
import { ListAdditionsByProduct } from '../../../../application/use-cases/additions/list-additions-by-product.js';

export class ListAdditionsByProductController {
  public constructor(private listAdditionsByProduct: ListAdditionsByProduct) {}

  public async execute(
    request: Request<{ productId: string }>,
    response: Response<ListAdditionsByProductOutput>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { productId } = request.params;

      const input: ListAdditionsByProductInput = { productId };
      const output = await this.listAdditionsByProduct.list(input);

      response.status(200).json(output);
    } catch (error) {
      next(error);
    }
  }
}
