export interface UpdateCategoryInput {
  name: string;
  sortOrder?: number;
  categoryId: string;
}

export interface UpdateCategoryOutput {
  id: string;
}
