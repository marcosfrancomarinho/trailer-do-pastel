import type { ProductRepository } from '../../../domain/repositories/product-repository.js';
import { ReferenceId } from '../../../domain/value-objects/shared/reference-id.js';
import type { DeleteProductInput } from '../../dtos/products/delete-product-dto.js';

export class DeleteProduct {
  public constructor(private readonly productRepository: ProductRepository) {}

  public async delete(input: DeleteProductInput): Promise<void> {
    const productId = ReferenceId.create(input.productId, 'productId');
    await this.productRepository.deleteById(productId.getValue());
  }
}
