import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { createTestDatabase, resetTestDatabase } from '../helpers/database.js';
import { startApi } from '../helpers/api-server.js';
import type { CreateOrderOutput } from '../../src/application/dtos/orders/create-order-dto.js';
import type { ListTableOrdersOutput } from '../../src/application/dtos/tables/list-table-orders-dto.js';
import type { ListTableSessionsOutput } from '../../src/application/dtos/tables/list-table-sessions-dto.js';
import type { PendingOrderListItem } from '../../src/application/dtos/orders/list-pending-orders-dto.js';
import type { OrderHistoryListItem } from '../../src/application/dtos/orders/list-order-history-dto.js';

describe('E2E: production bundle → HTTP → authentication → use cases → PostgreSQL', { concurrency: false }, () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>;
  let api: Awaited<ReturnType<typeof startApi>>;
  let passwordHash: string;
  let adminToken: string;
  let employeeToken: string;
  let adminId: string;
  let employeeId: string;
  let categoryId: string;
  let productId: string;
  let additionId: string;
  const password = 'Senha12345';

  async function request<T = { id: string; code: string; field: string; status: string; accessToken: string }>(
    method: string, path: string, expectedStatus: number, body?: unknown, token?: string,
  ): Promise<T> {
    const response = await fetch(`${api.baseUrl}${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10_000),
    });
    const text = await response.text();
    assert.equal(response.status, expectedStatus, `${method} ${path}: ${text}`);
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const orderBody = () => ({ customerName: ' Maria ', customerPhone: '(11) 99999-9999', observation: ' Sem cebola ',
    items: [{ productId, quantity: 3, additions: [{ additionId, quantity: 2 }] }] });

  before(async () => {
    db = await createTestDatabase('e2e');
    passwordHash = await bcrypt.hash(password, 12);
    api = await startApi(db.databaseUrl);
  });
  after(async () => {
    try { await api?.close(); } finally { await db?.close(); }
  });
  beforeEach(async () => {
    await resetTestDatabase(db.prisma);
    const admin = await db.prisma.user.create({ data: { name: 'Administrador', password: passwordHash, role: 'ADMIN' } });
    adminId = admin.id;
    adminToken = (await request('POST', '/login', 200, { name: admin.name, password })).accessToken;
    employeeId = (await request('POST', '/users', 201, { name: 'Atendente', password, role: 'ADMIN' }, adminToken)).id;
    employeeToken = (await request('POST', '/login', 200, { name: 'Atendente', password })).accessToken;
    categoryId = (await request('POST', '/categories', 201, { name: 'Pasteis' }, adminToken)).id;
    additionId = (await request('POST', '/additions', 201, { name: 'Queijo extra', price: '0.20' }, adminToken)).id;
    productId = (await request('POST', '/products', 201, { name: 'Pastel de queijo', description: 'Preparado na hora',
      categoryId, price: '0.10', additionIds: [additionId] }, adminToken)).id;
  });

  it('authenticates real password hashes and enforces roles, self-deletion and token revocation', async () => {
    await request('POST', '/login', 401, { name: 'Atendente', password: 'Errada123' });
    await request('GET', '/users', 401);
    await request('GET', '/users', 401, undefined, 'invalid-token');
    await request('GET', '/users', 403, undefined, employeeToken);
    await request('POST', '/store/close', 403, {}, employeeToken);
    const users = await request<Array<{ id: string; role: string; password?: string }>>('GET', '/users', 200, undefined, adminToken);
    assert.equal(users.find(user => user.id === employeeId)?.role, 'EMPLOYEE');
    assert.ok(users.every(user => !('password' in user)));
    const employee = await db.prisma.user.findUniqueOrThrow({ where: { id: employeeId } });
    assert.notEqual(employee.password, password);
    assert.ok(await bcrypt.compare(password, employee.password));
    assert.equal((await request('DELETE', `/users/${adminId}`, 409, undefined, adminToken)).code, 'IN_USE');
    await request('DELETE', `/users/${employeeId}`, 204, undefined, adminToken);
    await request('GET', '/tables', 401, undefined, employeeToken);
  });

  it('creates an online order with trusted catalog prices and tracks it through completion', async () => {
    const order = await request<CreateOrderOutput>('POST', '/orders', 201, {
      ...orderBody(), total: '0.01', status: 'COMPLETED', userId: adminId,
    });
    assert.equal(order.total, '1.5');
    assert.equal(order.status, 'PENDING');
    assert.equal(order.tableId, null);
    const tracking = await request<Record<string, unknown>>('GET', `/orders/tracking/${order.trackingToken}`, 200);
    assert.equal(tracking.status, 'PENDING');
    assert.deepEqual(Object.keys(tracking).sort(), ['status', 'updatedAt']);
    await request('GET', '/orders/tracking/unknown', 404);
    const pending = await request<PendingOrderListItem[]>('GET', '/orders/pending', 200, undefined, employeeToken);
    assert.equal(pending[0].id, order.id);
    assert.equal(pending[0].observation, 'Sem cebola');
    assert.equal(pending[0].items[0].unitPrice, '0.1');
    for (const status of ['CONFIRMED', 'PREPARING', 'COMPLETED']) {
      await request('PATCH', `/orders/${order.id}/status`, 200, { status }, employeeToken);
    }
    const history = await request<OrderHistoryListItem[]>('GET', '/orders/history', 200, undefined, employeeToken);
    assert.deepEqual(history[0].histories.map(entry => entry.status), ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED']);
    assert.equal((await request('GET', `/orders/tracking/${order.trackingToken}`, 200)).status, 'COMPLETED');
    await request('PATCH', `/orders/${order.id}/status`, 409, { status: 'PENDING' }, employeeToken);
    assert.equal((await db.prisma.order.findUniqueOrThrow({ where: { id: order.id } })).userId, null);
  });

  it('serves public catalog reads and validates catalog mutations and deletion restrictions', async () => {
    const products = await request<Array<{ id: string; price: string }>>('GET', '/products', 200);
    assert.equal(products[0].price, '0.1');
    const linked = await request<Array<{ id: string }>>('GET', `/products/${productId}/additions`, 200);
    assert.equal(linked[0].id, additionId);
    const categoryProducts = await request<Array<{ id: string }>>('GET', `/categories/${categoryId}/products`, 200);
    assert.equal(categoryProducts[0].id, productId);
    await request('POST', '/products', 403, {}, employeeToken);
    await request('POST', '/categories', 409, { name: 'Pasteis' }, adminToken);
    await request('PATCH', `/products/${productId}`, 400, { price: '0' }, adminToken);
    await request('PATCH', `/products/${productId}`, 200, { imageUrl: 'https://example.com/pastel.jpg', price: '12.50' }, adminToken);
    assert.equal((await db.prisma.product.findUniqueOrThrow({ where: { id: productId } })).price.toString(), '12.5');
    await request('POST', '/orders', 201, orderBody());
    for (const path of [`/products/${productId}`, `/categories/${categoryId}`, `/additions/${additionId}`]) {
      assert.equal((await request('DELETE', path, 409, undefined, adminToken)).code, 'IN_USE');
    }
  });

  it('creates table orders, records the authenticated employee and closes a historical session', async () => {
    const table = await request('POST', '/tables', 201, { number: 1 }, employeeToken);
    await request('POST', '/orders', 401, { ...orderBody(), tableId: table.id });
    const order = await request<CreateOrderOutput>('POST', '/orders', 201,
      { ...orderBody(), tableId: table.id, userId: adminId }, employeeToken);
    const current = await request<ListTableOrdersOutput>('GET', `/tables/${table.id}/orders`, 200, undefined, employeeToken);
    assert.equal(current.totalSpent, '1.5');
    assert.deepEqual(current.orders[0].createdBy, { name: 'Atendente', role: 'EMPLOYEE' });
    assert.equal((await db.prisma.order.findUniqueOrThrow({ where: { id: order.id } })).userId, employeeId);
    await request('PATCH', `/tables/${table.id}/release`, 409, {}, employeeToken);
    await request('DELETE', `/tables/${table.id}`, 409, undefined, employeeToken);
    await request('PATCH', `/orders/${order.id}/status`, 200, { status: 'COMPLETED' }, employeeToken);
    const released = await request<{ closedTotal: string; totalSpent: string }>('PATCH', `/tables/${table.id}/release`, 200, {}, employeeToken);
    assert.equal(released.closedTotal, '1.5');
    assert.equal(released.totalSpent, '0');
    const sessions = await request<ListTableSessionsOutput>('GET', `/tables/${table.id}/sessions`, 200, undefined, employeeToken);
    assert.equal(sessions.sessions[0].orders[0].id, order.id);
    assert.equal(sessions.sessions[0].closedTotal, '1.5');
    await request('DELETE', `/tables/${table.id}`, 204, undefined, employeeToken);
    assert.equal(await db.prisma.tableSession.count({ where: { tableId: table.id } }), 1);
  });

  it('removes a table order once and keeps the canceled order in its historical session', async () => {
    const table = await request('POST', '/tables', 201, { number: 1 }, employeeToken);
    const order = await request<CreateOrderOutput>('POST', '/orders', 201, { ...orderBody(), tableId: table.id }, employeeToken);
    const removed = await request<{ totalSpent: string }>('DELETE', `/tables/${table.id}/orders/${order.id}`, 200, undefined, employeeToken);
    assert.equal(removed.totalSpent, '0');
    await request('DELETE', `/tables/${table.id}/orders/${order.id}`, 404, undefined, employeeToken);
    await request('PATCH', `/tables/${table.id}/release`, 200, {}, employeeToken);
    const sessions = await request<ListTableSessionsOutput>('GET', `/tables/${table.id}/sessions`, 200, undefined, employeeToken);
    assert.equal(sessions.sessions[0].orders[0].status, 'CANCELED');
    assert.equal(sessions.sessions[0].closedTotal, '0');
  });

  it('closes and reopens the store, refusing new online and table orders while closed', async () => {
    const table = await request('POST', '/tables', 201, { number: 1 }, employeeToken);
    await request('POST', '/store/close', 200, {}, adminToken);
    assert.equal((await request('GET', '/store/status', 200)).status, 'CLOSED');
    assert.equal((await request('POST', '/orders', 409, orderBody())).code, 'UNAVAILABLE');
    await request('POST', '/orders', 409, { ...orderBody(), tableId: table.id }, employeeToken);
    assert.equal(await db.prisma.order.count(), 0);
    assert.equal(await db.prisma.tableSession.count(), 0);
    await request('POST', '/store/open', 200, {}, adminToken);
    await request('POST', '/orders', 201, orderBody());
  });

  it('rejects invalid and unavailable orders without persisting partial data', async () => {
    await request('POST', '/orders', 400, { ...orderBody(), items: [] });
    await request('POST', '/orders', 400, { ...orderBody(), customerPhone: 'invalid' });
    await request('POST', '/orders', 400, { ...orderBody(), items: [{ productId, quantity: 0 }] });
    await request('PATCH', `/products/${productId}`, 200, { available: false }, adminToken);
    assert.equal((await request('POST', '/orders', 409, orderBody())).code, 'UNAVAILABLE');
    await request('GET', '/orders/pending?date=2026-02-30', 400, undefined, employeeToken);
    assert.equal(await db.prisma.order.count(), 0);
    assert.equal(await db.prisma.orderItem.count(), 0);
    assert.equal(await db.prisma.orderStatusHistory.count(), 0);
  });
});
