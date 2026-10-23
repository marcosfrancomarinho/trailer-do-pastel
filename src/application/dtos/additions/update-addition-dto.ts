export interface UpdateAdditionInput {
  additionId: string;
  name?: string;
  price?: string;
  available?: boolean;
}

export interface UpdateAdditionOutput {
  id: string;
}
