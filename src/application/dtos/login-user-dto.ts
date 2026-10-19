export interface LoginUserInput {
  name: string;
  password: string;
}

export interface LoginUserOutput {
  name: string;
  accessToken: string;
}
