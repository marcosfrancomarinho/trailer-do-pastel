import type { Addition } from '../../domain/entities/addition.js';
import { OrderItemAddition } from '../../domain/entities/order-item-addition.js';
import type { AdditionRepository } from '../../domain/repositories/addition-repository.js';
import { OrderQuantity } from '../../domain/value-objects/order/order-quantity.js';
import { OrderUnitPrice } from '../../domain/value-objects/order/order-unit-price.js';
import { DecimalValue } from '../../domain/value-objects/shared/decimal-value.js';
import { ReferenceId } from '../../domain/value-objects/shared/reference-id.js';
import type { CreateOrderAdditionInput } from '../dtos/orders/create-order-dto.js';
import { ApplicationError } from '../errors/application-error.js';

export class CreateOrderItemAdditionService {
  public constructor(private additions: AdditionRepository) {}

  public async create(input: CreateOrderAdditionInput, productId: string): Promise<OrderItemAddition> {
    const additionId: ReferenceId = ReferenceId.create(input.additionId, 'additionId');
    const quantity: OrderQuantity = OrderQuantity.create(input.quantity);

    const addition: Addition | null = await this.additions.findById(additionId.getValue());

    if (!addition) {
      throw new ApplicationError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
    }

    if (addition.isUnavailable()) {
      throw new ApplicationError('additionId', 'UNAVAILABLE', 'O adicional informado está indisponível.');
    }

    const belongsToProduct: boolean = await this.additions.isLinkedToProduct(productId, additionId.getValue());

    if (!belongsToProduct) {
      throw new ApplicationError('additionId', 'NOT_ASSOCIATED', 'O adicional informado não pertence ao produto.');
    }

    const unitPrice: OrderUnitPrice = OrderUnitPrice.create(DecimalValue.create(addition.getPrice()));

    return OrderItemAddition.create(additionId, quantity, unitPrice);
  }
}
