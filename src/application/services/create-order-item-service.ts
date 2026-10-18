import { OrderItem } from '../../domain/entities/order-item.js';
import type { OrderItemAddition } from '../../domain/entities/order-item-addition.js';
import type { ProductRepository } from '../../domain/repositories/product-repository.js';
import { OrderQuantity } from '../../domain/value-objects/order/order-quantity.js';
import { OrderUnitPrice } from '../../domain/value-objects/order/order-unit-price.js';
import { ProductName } from '../../domain/value-objects/product/product-name.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';
import { ReferenceId } from '../../domain/value-objects/shared/reference-id.js';
import type { CreateOrderItemInput } from '../dtos/create-order-dto.js';
import { ApplicationError } from '../errors/application-error.js';
import { CreateOrderItemAdditionService } from './create-order-item-addition-service.js';

export class CreateOrderItemService {
  public constructor(
    private readonly productRepository: ProductRepository,
    private readonly createOrderItemAdditionService: CreateOrderItemAdditionService,
  ) {}

  public async create(input: CreateOrderItemInput): Promise<OrderItem> {
    const productId = ReferenceId.create(input.productId, 'productId');
    const quantity = OrderQuantity.create(input.quantity);
    const productName = ProductName.create(input.productName);
    const decimalPrice = DecimalValue.create(input.unitPrice);
    const unitPrice = OrderUnitPrice.create(decimalPrice);
    const itemAdditions: OrderItemAddition[] = [];

    const product = await this.productRepository.findProductById(productId.getValue());

    if (!product) {
      throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
    }

    if (!product.isAvailable()) {
      throw new ApplicationError('productId', 'UNAVAILABLE', 'O produto informado está indisponível.');
    }

    for (const addition of input.additions) {
      const itemAddition = await this.createOrderItemAdditionService.create(addition);
      itemAdditions.push(itemAddition);
    }

    return OrderItem.create(productId, productName, quantity, unitPrice, itemAdditions);
  }
}
