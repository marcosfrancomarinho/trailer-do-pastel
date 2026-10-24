export interface ListPendingOrdersInput {
  date?: unknown;
}

export interface PendingOrderAddition {
  additionId: string;
  additionName: string;
  quantity: number;
  unitPrice: string;
}

export interface PendingOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  additions: PendingOrderAddition[];
}

export interface PendingOrderListItem {
  id: string;
  customerName: string;
  customerPhone: string;
  observation: string | null;
  tableId: string | null;
  status: 'PENDING';
  total: string;
  createdAt: string;
  items: PendingOrderItem[];
}

export type ListPendingOrdersOutput = PendingOrderListItem[];
