import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, resetTestDatabase, seedCatalog } from '../helpers/database.js';
import { CreateOrder } from '../../src/application/use-cases/orders/create-order.js';
import { EventObserver } from '../../src/application/observer/event-observer.js';
import { CreateOrderItemService } from '../../src/application/services/create-order-item-service.js';
import { CreateOrderItemAdditionService } from '../../src/application/services/create-order-item-addition-service.js';
import { PrismaOrderRepository } from '../../src/infrastructure/repositories/prisma-order-repository.js';
import { PrismaProductRepository } from '../../src/infrastructure/repositories/prisma-product-repository.js';
import { PrismaAdditionRepository } from '../../src/infrastructure/repositories/prisma-addition-repository.js';
import { PrismaTableRepository } from '../../src/infrastructure/repositories/prisma-table-repository.js';
import { PrismaCategoryRepository } from '../../src/infrastructure/repositories/prisma-category-repository.js';
import { PrismaOrderQueries } from '../../src/infrastructure/queries/prisma-order-queries.js';
import { PrismaTableOrderQueries } from '../../src/infrastructure/queries/prisma-table-order-queries.js';
import { OrderStatus } from '../../src/domain/value-objects/order/order-status.js';
import { OrderDateRange } from '../../src/domain/value-objects/order/order-date-range.js';
import { Order } from '../../src/domain/entities/order.js';
import { CustomerName } from '../../src/domain/value-objects/customer/customer-name.js';
import { CustomerPhone } from '../../src/domain/value-objects/customer/customer-phone.js';
import { ReferenceId } from '../../src/domain/value-objects/shared/reference-id.js';
import { Product } from '../../src/domain/entities/product.js';
import { ProductName } from '../../src/domain/value-objects/product/product-name.js';
import { ProductDescription } from '../../src/domain/value-objects/product/product-description.js';
import { ProductPrice } from '../../src/domain/value-objects/product/product-price.js';
import { DecimalValue } from '../../src/domain/value-objects/shared/decimal-value.js';
import { ApplicationError } from '../../src/application/errors/application-error.js';
import { buildOrderItem, buildCatalogAddition } from '../helpers/order-fixtures.js';

const rule = (field: string, code: string) => (error: unknown) =>
  error instanceof ApplicationError && error.field === field && error.code === code;

describe('PostgreSQL integration: migrations, repositories, use cases and transactions', { concurrency: false }, () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>;
  let catalog: Awaited<ReturnType<typeof seedCatalog>>;
  let orders: PrismaOrderRepository;
  let createOrder: CreateOrder;

  before(async () => {
    db = await createTestDatabase('integration');
    orders = new PrismaOrderRepository(db.prisma);
    createOrder = new CreateOrder(orders, new CreateOrderItemService(new PrismaProductRepository(db.prisma),
      new CreateOrderItemAdditionService(new PrismaAdditionRepository(db.prisma))), new EventObserver());
  });
  after(async () => { await db?.close(); });
  beforeEach(async () => {
    await resetTestDatabase(db.prisma);
    catalog = await seedCatalog(db.prisma);
  });

  async function orderAtTable() {
    const table = await db.prisma.table.create({ data: { number: 1 } });
    const user = await db.prisma.user.create({ data: { name: 'Atendente', password: 'unused' } });
    const input = { customerName: ' Maria ', customerPhone: '(11) 99999-9999', tableId: table.id, userId: user.id,
      items: [{ productId: catalog.product.id, quantity: 3, additions: [{ additionId: catalog.addition.id, quantity: 2 }] }] };
    return { table, user, input, order: await createOrder.create(input) };
  }

  it('persists catalog snapshots, decimal totals, additions and the initial status history', async () => {
    const { table, user, order } = await orderAtTable();
    assert.equal(order.total, '1.5');
    const stored = await db.prisma.order.findUniqueOrThrow({ where: { id: order.id },
      include: { items: { include: { additions: true } }, histories: true } });
    assert.equal(stored.customerName, 'Maria');
    assert.equal(stored.customerPhone, '11999999999');
    assert.equal(stored.userId, user.id);
    assert.equal(stored.items[0].unitPrice.toString(), '0.1');
    assert.equal(stored.items[0].additions[0].unitPrice.toString(), '0.2');
    assert.equal(stored.items[0].additions[0].quantity, 2);
    assert.deepEqual(stored.histories.map(history => history.status), ['PENDING']);
    assert.equal((await db.prisma.table.findUniqueOrThrow({ where: { id: table.id } })).totalSpent.toString(), '1.5');
    assert.equal(await db.prisma.tableSession.count({ where: { tableId: table.id, closedAt: null } }), 1);
  });

  it('serializes concurrent table orders into one session without losing increments', async () => {
    const { table, input } = await orderAtTable();
    const results = await Promise.all(Array.from({ length: 4 }, () => createOrder.create(input)));
    assert.equal(new Set(results.map(order => order.id)).size, 4);
    assert.equal((await db.prisma.table.findUniqueOrThrow({ where: { id: table.id } })).totalSpent.toString(), '7.5');
    assert.equal(await db.prisma.tableSession.count({ where: { tableId: table.id, closedAt: null } }), 1);
    assert.equal(await db.prisma.order.count({ where: { tableId: table.id } }), 5);
  });

  it('rolls back the table total and new session if nested order persistence fails', async () => {
    const table = await db.prisma.table.create({ data: { number: 1 } });
    // Real foreign key failure after the transaction has occupied the table and opened a session.
    const invalidItem = buildOrderItem();
    const invalidOrder = Order.create(
      CustomerName.create('Maria'), CustomerPhone.create('11999999999'),
      [invalidItem], undefined,
      ReferenceId.create(table.id, 'tableId'));
    await assert.rejects(orders.save(invalidOrder), rule('order', 'NOT_FOUND'));
    const current = await db.prisma.table.findUniqueOrThrow({ where: { id: table.id } });
    assert.equal(current.status, 'FREE');
    assert.equal(current.totalSpent.toString(), '0');
    assert.equal(await db.prisma.tableSession.count(), 0);
    assert.equal(await db.prisma.order.count(), 0);
    assert.equal(await db.prisma.orderStatusHistory.count(), 0);
  });

  it('deducts a concurrently removed order exactly once and preserves its session history', async () => {
    const { table, order } = await orderAtTable();
    const results = await Promise.allSettled([
      orders.removeFromTable(table.id, order.id), orders.removeFromTable(table.id, order.id),
    ]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    const rejection = results.find(result => result.status === 'rejected');
    assert.ok(rejection?.status === 'rejected' && rule('orderId', 'NOT_FOUND')(rejection.reason));
    const stored = await db.prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(stored.status, 'CANCELED');
    assert.equal(stored.tableId, null);
    assert.ok(stored.tableSessionId);
    assert.equal((await db.prisma.table.findUniqueOrThrow({ where: { id: table.id } })).totalSpent.toString(), '0');
    assert.equal(await db.prisma.orderStatusHistory.count({ where: { orderId: order.id, status: 'CANCELED' } }), 1);
  });

  it('rolls back cancellation, history and table unlinking when the total is inconsistent', async () => {
    const { table, order } = await orderAtTable();
    await db.prisma.table.update({ where: { id: table.id }, data: { totalSpent: '0' } });
    await assert.rejects(orders.removeFromTable(table.id, order.id), rule('tableId', 'IN_USE'));
    const stored = await db.prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(stored.status, 'PENDING');
    assert.equal(stored.tableId, table.id);
    assert.equal(await db.prisma.orderStatusHistory.count({ where: { orderId: order.id } }), 1);
  });

  it('rolls back a status cancellation when its table adjustment fails', async () => {
    const { table, order } = await orderAtTable();
    await db.prisma.table.update({ where: { id: table.id }, data: { totalSpent: '0' } });
    await assert.rejects(orders.updateStatus(order.id, OrderStatus.create('CANCELED')), rule('tableId', 'IN_USE'));
    assert.equal((await db.prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status, 'PENDING');
    assert.equal(await db.prisma.orderStatusHistory.count({ where: { orderId: order.id } }), 1);
  });

  it('refuses to release active orders, then closes a completed session with its exact collected total', async () => {
    const { table, order } = await orderAtTable();
    const tables = new PrismaTableRepository(db.prisma);
    await assert.rejects(tables.release(table.id), rule('tableId', 'IN_USE'));
    await orders.updateStatus(order.id, OrderStatus.create('COMPLETED'));
    const released = await tables.release(table.id);
    assert.equal(released.closedTotal, '1.5');
    assert.equal(released.totalSpent, '0');
    assert.equal(released.status, 'FREE');
    const sessions = await new PrismaTableOrderQueries(db.prisma).findSessionsByTableId(table.id);
    assert.ok(sessions);
    assert.equal(await db.prisma.tableSession.count({ where: { tableId: table.id, closedAt: null } }), 0);
    const stored = await db.prisma.tableSession.findUniqueOrThrow({ where: { id: released.sessionId } });
    assert.equal(stored.closedTotal?.toString(), '1.5');
    assert.ok(stored.closedAt);
  });

  it('rejects orders while closed without changing tables, sessions or histories', async () => {
    const { table, input } = await orderAtTable();
    await db.prisma.store.update({ where: { id: 1 }, data: { status: 'CLOSED' } });
    await assert.rejects(createOrder.create(input), rule('store', 'UNAVAILABLE'));
    assert.equal(await db.prisma.order.count(), 1);
    assert.equal(await db.prisma.orderStatusHistory.count(), 1);
    assert.equal((await db.prisma.table.findUniqueOrThrow({ where: { id: table.id } })).totalSpent.toString(), '1.5');
  });

  it('rolls back product fields and addition links if a replacement references a missing addition', async () => {
    const products = new PrismaProductRepository(db.prisma);
    const product = await products.findProductById(catalog.product.id);
    assert.ok(product);
    const changed = Product.create(ProductName.create('Novo nome'), ProductPrice.create(DecimalValue.create('99')),
      ProductDescription.create('Nova descricao'), ReferenceId.create(catalog.category.id, 'categoryId'),
      false, null, product.getId());
    // A stale catalog snapshot models an addition removed between validation and persistence.
    const missing = buildCatalogAddition(randomUUID(), '0.2');
    await assert.rejects(products.update(changed, [missing]), rule('product', 'NOT_FOUND'));
    assert.deepEqual(await db.prisma.productAddition.findMany({ where: { productId: product.getId() } }), [
      { productId: product.getId(), additionId: catalog.addition.id },
    ]);
    const unchanged = await products.findProductById(product.getId());
    assert.equal(unchanged?.getPrice(), '0.1');
    assert.equal(unchanged?.getName(), 'Pastel de queijo');
    assert.equal(unchanged?.isAvailable(), true);
  });

  it('archives catalog records used by past orders without deleting their history', async () => {
    const { order } = await orderAtTable();
    await new PrismaProductRepository(db.prisma).deleteById(catalog.product.id);
    await new PrismaAdditionRepository(db.prisma).deleteById(catalog.addition.id);
    await new PrismaCategoryRepository(db.prisma).deleteById(catalog.category.id);

    const [category, product, addition, storedOrder] = await Promise.all([
      db.prisma.category.findUniqueOrThrow({ where: { id: catalog.category.id } }),
      db.prisma.product.findUniqueOrThrow({ where: { id: catalog.product.id } }),
      db.prisma.addition.findUniqueOrThrow({ where: { id: catalog.addition.id } }),
      db.prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: { include: { additions: true } } },
      }),
    ]);
    assert.ok(category.deletedAt);
    assert.ok(product.deletedAt);
    assert.ok(addition.deletedAt);
    assert.equal(product.available, false);
    assert.equal(addition.available, false);
    assert.equal(storedOrder.items[0].productId, product.id);
    assert.equal(storedOrder.items[0].additions[0].additionId, addition.id);
    assert.equal(await new PrismaProductRepository(db.prisma).findProductById(product.id), null);
    assert.equal(await new PrismaAdditionRepository(db.prisma).findAdditionById(addition.id), null);
  });

  it('applies inclusive and exclusive local date boundaries in actual SQL', async () => {
    const dates = ['2026-10-27T02:59:59.999Z', '2026-10-27T03:00:00.000Z',
      '2026-10-28T02:59:59.999Z', '2026-10-28T03:00:00.000Z'];
    const stored = await Promise.all(dates.map(createdAt => db.prisma.order.create({ data: {
      customerName: 'Maria', customerPhone: '11999999999', total: '0.1', createdAt: new Date(createdAt),
    } })));
    const result = await new PrismaOrderQueries(db.prisma).findPending(OrderDateRange.create('2026-10-27'));
    assert.deepEqual(result.map(order => order.id), [stored[1].id, stored[2].id]);
  });

  it('keeps historical sessions when a free table is archived and permits reusing its number', async () => {
    const { table, order } = await orderAtTable();
    const tables = new PrismaTableRepository(db.prisma);
    await orders.updateStatus(order.id, OrderStatus.create('COMPLETED'));
    await tables.release(table.id);
    await tables.archive(table.id);
    assert.equal(await tables.existsByNumber(table.number), false);
    assert.equal(await db.prisma.tableSession.count({ where: { tableId: table.id } }), 1);
    assert.ok((await db.prisma.table.findUniqueOrThrow({ where: { id: table.id } })).deletedAt);
    await db.prisma.table.create({ data: { number: table.number } });
  });
});
