import jwt from 'jsonwebtoken';
import type { AuthTokenGateway } from '../../application/gateways/auth-token-gateway.js';

export class JwtAuthTokenGateway implements AuthTokenGateway {
  private readonly secret: string;

  public constructor(secret: string | undefined) {
    if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error('JWT_SECRET deve conter pelo menos 32 bytes.');
    }
    this.secret = secret;
  }

  public async issue(userId: string): Promise<string> {
    return jwt.sign({}, this.secret, {
      algorithm: 'HS256',
      subject: userId,
      expiresIn: '1h',
    });
  }

  public async verify(token: string): Promise<string | null> {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });

      if (typeof payload === 'string') return null;

      const userId = payload.sub;
      if (typeof userId !== 'string' || userId.trim() === '') return null;

      return userId;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) return null;
      throw error;
    }
  }
}
