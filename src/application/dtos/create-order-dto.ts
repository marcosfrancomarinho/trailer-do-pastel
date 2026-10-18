export interface CreateOrderAdditionInput {
  additionId: string;
  unitPrice: string;
  quantity: number;
}

export interface CreateOrderItemInput {
  productId: string;
  productName: string;
  unitPrice: string;
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
