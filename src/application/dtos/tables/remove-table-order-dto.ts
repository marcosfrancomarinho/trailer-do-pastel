export interface RemoveTableOrderInput {
  tableId: string;
  orderId: string;
}

export interface RemoveTableOrderOutput {
  orderId: string;
  tableId: null;
  status: 'CANCELED';
  totalSpent: string;
}
