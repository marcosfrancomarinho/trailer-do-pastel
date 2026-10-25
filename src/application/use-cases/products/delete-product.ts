import type { ProductRepository } from '../../../domain/repositories/product-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteProductInput } from '../../dtos/products/delete-product-dto.js';
import { ApplicationError } from '../../errors/application-error.js';

export class DeleteProduct {
  public constructor(private productRepository: ProductRepository) {}

  public async delete(input: DeleteProductInput): Promise<void> {
    const productId = ReferenceId.create(input.productId, 'productId');
    const productExists = await this.productRepository.existsById(productId.getValue());

    if (!productExists) {
      throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
    }

    await this.productRepository.deleteById(productId.getValue());
  }
}
