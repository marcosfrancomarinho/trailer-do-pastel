export interface TableListItem {
  id: string;
  number: number;
  status: 'FREE' | 'OCCUPIED';
  totalSpent: string;
}

export type ListTablesOutput = TableListItem[];
