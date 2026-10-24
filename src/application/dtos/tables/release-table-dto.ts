export interface ReleaseTableInput {
  tableId: string;
}

export interface ReleaseTableOutput {
  id: string;
  status: 'FREE';
  totalSpent: string;
  sessionId: string;
  closedTotal: string;
}
