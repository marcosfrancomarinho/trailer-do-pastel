import { DomainError } from '../../errors/domain-error.js';

export class OrderStatus {
  public static VALID_STATUSES = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'COMPLETED',
    'CANCELED',
  ] as const;

  private constructor(private status: OrderStatusValue) {}

  public static create(status: string): OrderStatus {
    OrderStatus.validate(status);
    return new OrderStatus(status);
  }

  public getValue(): OrderStatusValue {
    return this.status;
  }

  private static validate(status: unknown): asserts status is OrderStatusValue {
    if (status === undefined || status === null) {
      throw new DomainError('status', 'REQUIRED', 'O status do pedido é obrigatório.');
    }

    if (typeof status !== 'string') {
      throw new DomainError('status', 'INVALID_TYPE', 'O status do pedido deve ser um texto.');
    }

    if (!OrderStatus.VALID_STATUSES.includes(status as OrderStatusValue)) {
      throw new DomainError('status', 'INVALID_FORMAT', 'O status informado não é válido.');
    }
  }
}

export type OrderStatusValue = (typeof OrderStatus.VALID_STATUSES)[number];
