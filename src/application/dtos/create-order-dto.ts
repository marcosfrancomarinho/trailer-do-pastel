export interface CreateOrderAdditionInput {
  additionId: string;
  quantity: number;
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  additions: CreateOrderAdditionInput[];
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  items: CreateOrderItemInput[];
}

export interface CreateOrderOutput {
  id: string;
  trackingToken: string;
  status: 'PENDING';
  total: string;
}
