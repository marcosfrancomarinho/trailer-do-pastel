import { createToken } from '../../kit-dev/di/container.js';

export const JWT_SECRET_TOKEN = createToken<string | undefined>('JWT_SECRET');
