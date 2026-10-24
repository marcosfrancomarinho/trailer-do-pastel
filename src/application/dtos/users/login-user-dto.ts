export interface LoginUserInput {
  name: string;
  password: string;
}

export interface LoginUserOutput {
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  accessToken: string;
}
