export interface AuthTokenGateway {
  issue(userId: string): Promise<string>;
}
