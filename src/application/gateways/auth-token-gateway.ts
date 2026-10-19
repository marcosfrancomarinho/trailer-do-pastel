export interface AuthTokenGateway {
  issue(userId: string): Promise<string>;
  verify(token: string): Promise<string | null>;
}
