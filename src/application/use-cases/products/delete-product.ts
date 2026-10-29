import type { ProductRepository } from '../../../domain/repositories/product-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteProductInput } from '../../dtos/products/delete-product-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class DeleteProduct {
  public constructor(private products: ProductRepository) {}

  public async delete(input: DeleteProductInput): Promise<void> {
    const productId: ReferenceId = ReferenceId.create(input.productId, 'productId');
    const productExists: boolean = await this.products.existsById(productId.getValue());

    if (!productExists) {
      throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
    }

    await this.products.deleteById(productId.getValue());
  }
}
