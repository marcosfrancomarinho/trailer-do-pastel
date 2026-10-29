import { OrderItem } from '../../domain/entities/order-item.js';
import type { OrderItemAddition } from '../../domain/entities/order-item-addition.js';
import type { Product } from '../../domain/entities/product.js';
import type { ProductRepository } from '../../domain/repositories/product-repository.js';
import { OrderQuantity } from '../../domain/value-objects/order/order-quantity.js';
import { OrderUnitPrice } from '../../domain/value-objects/order/order-unit-price.js';
import { ProductName } from '../../domain/value-objects/product/product-name.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';
import { ReferenceId } from '../../domain/value-objects/shared/reference-id.js';
import type { CreateOrderItemInput } from '../dtos/orders/create-order-dto.js';
import { ApplicationError } from '../errors/application-error.js';
import { CreateOrderItemAdditionService } from './create-order-item-addition-service.js';

export class CreateOrderItemService {
  public constructor(
    private products: ProductRepository,
    private orderItemAdditions: CreateOrderItemAdditionService,
  ) {}

  public async create(input: CreateOrderItemInput): Promise<OrderItem> {
    const productId: ReferenceId = ReferenceId.create(input.productId, 'productId');
    const quantity: OrderQuantity = OrderQuantity.create(input.quantity);

    const product: Product | null = await this.products.findById(productId.getValue());

    if (!product) {
      throw new ApplicationError('productId', 'NOT_FOUND', 'O produto informado não foi encontrado.');
    }

    if (product.isUnavailable()) {
      throw new ApplicationError('productId', 'UNAVAILABLE', 'O produto informado está indisponível.');
    }

    const productName: ProductName = ProductName.create(product.getName());
    const unitPrice: OrderUnitPrice = OrderUnitPrice.create(DecimalValue.create(product.getPrice()));

    const additionPromises: Promise<OrderItemAddition>[] = input.additions.map((addition) =>
      this.orderItemAdditions.create(addition, productId.getValue()),
    );
    const itemAdditions: OrderItemAddition[] = await Promise.all(additionPromises);

    return OrderItem.create(productId, productName, quantity, unitPrice, itemAdditions);
  }
}
