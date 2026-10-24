export interface UserListItem {
  id: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  createdAt: string;
}

export type ListUsersOutput = UserListItem[];
