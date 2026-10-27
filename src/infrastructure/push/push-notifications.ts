import { createCipheriv, createECDH, createPrivateKey, createSign, hkdfSync, randomBytes } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../application/errors/application-error.js';

type SubscriptionPayload = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
const b64 = (data: Buffer | Uint8Array): string => Buffer.from(data).toString('base64url');
const decode = (data: string): Buffer => Buffer.from(data, 'base64url');
const hkdf = (salt: Uint8Array, material: Uint8Array, info: Buffer, size: number): Buffer =>
  Buffer.from(hkdfSync('sha256', material, salt, info, size));
const utf8 = (value: string) => Buffer.from(value, 'utf8');

function isTrustedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const hostname = url.hostname.toLowerCase();
    return hostname === 'fcm.googleapis.com' ||
      hostname === 'updates.push.services.mozilla.com' ||
      hostname === 'push.services.mozilla.com' ||
      hostname === 'web.push.apple.com' ||
      hostname.endsWith('.push.apple.com') ||
      hostname.endsWith('.notify.windows.com');
  } catch { return false; }
}

function validate(body: unknown): { endpoint: string; p256dh: string; auth: string } {
  const data = body as SubscriptionPayload | null;
  const endpoint = data?.endpoint;
  const p256dh = data?.keys?.p256dh;
  const auth = data?.keys?.auth;
  if (typeof endpoint !== 'string' || endpoint.length > 2048 || !isTrustedPushEndpoint(endpoint) ||
      typeof p256dh !== 'string' || typeof auth !== 'string' ||
      decode(p256dh).length !== 65 || decode(auth).length !== 16) {
    throw new ApplicationError('subscription', 'UNAVAILABLE', 'Inscrição Push inválida.');
  }
  return { endpoint, p256dh, auth };
}

/** Web Push RFC 8291 (aes128gcm) + VAPID RFC 8292, sem dependências externas. */
export class PushNotifications {
  private prisma: PrismaClient | null = null;

  configure(prisma: PrismaClient): void { this.prisma = prisma; }

  publicKey(): string | null { return process.env.VAPID_PUBLIC_KEY || null; }

  private get db(): PrismaClient {
    if (!this.prisma) throw new Error('PushNotifications sem Prisma configurado.');
    return this.prisma;
  }

  private async orderIdForToken(token: string): Promise<string> {
    if (!token || token.length > 128) throw new ApplicationError('trackingToken', 'NOT_FOUND', 'Pedido não encontrado.');
    const order = await this.db.order.findUnique({
      where: { trackingToken: token },
      select: { id: true, status: true, tableId: true },
    });
    if (!order || order.tableId !== null || (order.status === 'CANCELED' || order.status === 'COMPLETED')) {
      throw new ApplicationError('trackingToken', 'NOT_FOUND', 'Pedido não encontrado.');
    }
    return order.id;
  }

  async subscribe(token: string, body: unknown): Promise<void> {
    const orderId = await this.orderIdForToken(token);
    if (!this.publicKey()) throw new ApplicationError('push', 'UNAVAILABLE', 'Notificações Push não configuradas.');
    const data = validate(body);
    await this.db.pushSubscription.upsert({
      where: { orderId_endpoint: { orderId, endpoint: data.endpoint } },
      create: { orderId, ...data },
      update: { p256dh: data.p256dh, auth: data.auth },
    });
  }

  async unsubscribe(token: string, body: unknown): Promise<void> {
    const orderId = await this.orderIdForToken(token);
    const data = body as { endpoint?: unknown } | null;
    if (typeof data?.endpoint !== 'string') return;
    await this.db.pushSubscription.deleteMany({ where: { orderId, endpoint: data.endpoint } });
  }

  async handle(event: unknown): Promise<void> {
    if (!event || typeof event !== 'object') return;
    const data = event as { orderId?: unknown; status?: unknown };
    if (data.status !== 'COMPLETED' || typeof data.orderId !== 'string') return;
    // Não bloqueia a confirmação do pedido enquanto o provedor Push responde.
    void this.sendCompleted(data.orderId).catch((error: unknown) => {
      console.error('Falha ao disparar Web Push:', error);
    });
  }

  private async sendCompleted(orderId: string): Promise<void> {
    if (!this.publicKey() || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) return;
    const order = await this.db.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, tableId: true, pushSubscriptions: true },
    });
    if (!order || order.status !== 'COMPLETED' || order.tableId !== null) return;
    const payload = JSON.stringify({
      title: 'Trailer do Pastel — Pedido pronto!',
      body: 'Seu pedido #' + order.id.slice(0, 8) + ' está pronto para retirada.',
      url: '/pedidos',
      tag: 'trailer-pedido-' + order.id,
    });
    await Promise.allSettled(order.pushSubscriptions.map(async (subscription) => {
      const response = await this.deliver(subscription.endpoint, subscription.p256dh, subscription.auth, payload);
      if (response.ok || response.status === 404 || response.status === 410) {
        await this.db.pushSubscription.delete({ where: { id: subscription.id } });
      } else if (!response.ok) {
        console.warn('Web Push HTTP', response.status);
      }
    }));
  }

  private async deliver(endpoint: string, p256dh: string, auth: string, payload: string): Promise<Response> {
    if (!isTrustedPushEndpoint(endpoint)) throw new Error('Push endpoint não permitido.');
    const userPublic = decode(p256dh);
    const serverKey = createECDH('prime256v1');
    serverKey.generateKeys();
    const serverPublic = serverKey.getPublicKey();
    const sharedSecret = serverKey.computeSecret(userPublic);
    const info = Buffer.concat([utf8('WebPush: info\0'), userPublic, serverPublic]);
    const ikm = hkdf(decode(auth), sharedSecret, info, 32);
    const salt = randomBytes(16);
    const cek = hkdf(salt, ikm, utf8('Content-Encoding: aes128gcm\0'), 16);
    const nonce = hkdf(salt, ikm, utf8('Content-Encoding: nonce\0'), 12);
    const cipher = createCipheriv('aes-128-gcm', cek, nonce);
    const plaintext = Buffer.concat([utf8(payload), Buffer.from([2])]);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
    const recordSize = Buffer.alloc(4);
    recordSize.writeUInt32BE(4096);
    const body = Buffer.concat([salt, recordSize, Buffer.from([65]), serverPublic, ciphertext]);

    const vapidPublic = decode(process.env.VAPID_PUBLIC_KEY!);
    const vapidPrivate = decode(process.env.VAPID_PRIVATE_KEY!);
    if (vapidPublic.length !== 65 || vapidPrivate.length !== 32) throw new Error('Chaves VAPID inválidas');
    const key = createPrivateKey({
      format: 'jwk',
      key: { kty: 'EC', crv: 'P-256', x: b64(vapidPublic.subarray(1, 33)),
        y: b64(vapidPublic.subarray(33, 65)), d: b64(vapidPrivate) },
    });
    const aud = new URL(endpoint).origin;
    const jwtHeader = b64(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const jwtBody = b64(utf8(JSON.stringify({
      aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: process.env.VAPID_SUBJECT,
    })));
    const data = jwtHeader + '.' + jwtBody;
    const signer = createSign('SHA256');
    signer.update(data);
    signer.end();
    const jwt = data + '.' + b64(signer.sign({ key, dsaEncoding: 'ieee-p1363' }));
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        Authorization: 'vapid t=' + jwt + ', k=' + this.publicKey(),
        TTL: '86400',
      },
      body,
      signal: AbortSignal.timeout(8000),
      redirect: 'error',
    });
  }
}

export const pushNotifications = new PushNotifications();
