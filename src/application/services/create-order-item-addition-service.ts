import { OrderItemAddition } from '../../domain/entities/order-item-addition.js';
import type { AdditionRepository } from '../../domain/repositories/addition-repository.js';
import { OrderQuantity } from '../../domain/value-objects/order/order-quantity.js';
import { OrderUnitPrice } from '../../domain/value-objects/order/order-unit-price.js';
import { ReferenceId } from '../../domain/value-objects/shared/reference-id.js';
import type { CreateOrderAdditionInput } from '../dtos/create-order-dto.js';
import { ApplicationError } from '../errors/application-error.js';

export class CreateOrderItemAdditionService {
  public constructor(private readonly additionRepository: AdditionRepository) {}

  public async create(input: CreateOrderAdditionInput): Promise<OrderItemAddition> {
    const additionId = ReferenceId.create(input.additionId, 'additionId');
    const quantity = OrderQuantity.create(input.quantity);

    const addition = await this.additionRepository.findAdditionById(additionId.getValue());

    if (!addition) {
      throw new ApplicationError('additionId', 'NOT_FOUND', 'O adicional informado não foi encontrado.');
    }

    if (!addition.isAvailable()) {
      throw new ApplicationError('additionId', 'UNAVAILABLE', 'O adicional informado está indisponível.');
    }

    const unitPrice = OrderUnitPrice.create(addition.getPrice());

    return OrderItemAddition.create(additionId, quantity, unitPrice);
  }
}
