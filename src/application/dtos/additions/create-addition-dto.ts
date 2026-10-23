export interface CreateAdditionInput {
  name: string;
  price: string;
  available?: boolean;
}

export interface CreateAdditionOutput {
  id: string;
}
