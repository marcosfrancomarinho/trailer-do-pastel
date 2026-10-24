export interface CreateTableInput {
  number: number;
  status?: string;
}

export interface CreateTableOutput {
  id: string;
  status: 'FREE' | 'OCCUPIED';
  totalSpent: string;
}
