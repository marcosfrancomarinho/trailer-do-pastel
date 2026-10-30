export interface CategoryListItem {
  id: string;
  name: string;
  sortOrder: number;
}

export type ListCategoriesOutput = CategoryListItem[];
