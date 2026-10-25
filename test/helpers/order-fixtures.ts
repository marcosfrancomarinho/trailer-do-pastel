import { Order } from '../../src/domain/entities/order.js';
import { OrderItem } from '../../src/domain/entities/order-item.js';
import { OrderItemAddition } from '../../src/domain/entities/order-item-addition.js';
import { Product } from '../../src/domain/entities/product.js';
import { Addition } from '../../src/domain/entities/addition.js';
import { ProductPrice } from '../../src/domain/value-objects/product/product-price.js';
import { ProductDescription } from '../../src/domain/value-objects/product/product-description.js';
import { AdditionName } from '../../src/domain/value-objects/addition/addition-name.js';
import { AdditionPrice } from '../../src/domain/value-objects/addition/addition-price.js';
import type { OrderRepository } from '../../src/domain/repositories/order-repository.js';
import type { ProductRepository } from '../../src/domain/repositories/product-repository.js';
import type { AdditionRepository } from '../../src/domain/repositories/addition-repository.js';
import type { CategoryRepository } from '../../src/domain/repositories/category-repository.js';
import { CustomerName } from '../../src/domain/value-objects/customer/customer-name.js';
import { CustomerPhone } from '../../src/domain/value-objects/customer/customer-phone.js';
import { DecimalValue } from '../../src/domain/value-objects/shared/decimal-value.js';
import { OrderQuantity } from '../../src/domain/value-objects/order/order-quantity.js';
import { OrderObservation } from '../../src/domain/value-objects/order/order-observation.js';
import { OrderUnitPrice } from '../../src/domain/value-objects/order/order-unit-price.js';
import { ProductName } from '../../src/domain/value-objects/product/product-name.js';
import { ReferenceId } from '../../src/domain/value-objects/shared/reference-id.js';

export function buildOrderAddition(quantity: number = 1, price: string = '2.50', id: string = 'addition-1'): OrderItemAddition {
  return OrderItemAddition.create(
    ReferenceId.create(id, 'additionId'),
    OrderQuantity.create(quantity),
    OrderUnitPrice.create(DecimalValue.create(price)),
  );
}

export function buildOrderItem(
  quantity: number = 1,
  price: string = '10.00',
  additions: OrderItemAddition[] = [],
): OrderItem {
  return OrderItem.create(
    ReferenceId.create('product-1', 'productId'),
    ProductName.create('Pastel de queijo'),
    OrderQuantity.create(quantity),
    OrderUnitPrice.create(DecimalValue.create(price)),
    additions,
  );
}

export function buildOrder(items: OrderItem[] = [buildOrderItem()], id?: string): Order {
  return Order.create(
    CustomerName.create(' Marcos '),
    CustomerPhone.create('(11) 99999-9999'),
    items,
    OrderObservation.create(),
    null,
    id,
  );
}

export function createOrderRepository(overrides: Partial<OrderRepository> = {}): OrderRepository {
  return {
    async save() {
      return { id: 'order-id', trackingToken: 'tracking-token' };
    },
    async updateStatus() {},
    async removeFromTable() { return '0'; },
    ...overrides,
  };
}

export function createProductRepository(overrides: Partial<ProductRepository> = {}): ProductRepository {
  return {
    async findProductById(id) {
      if (id === 'product-1') return buildCatalogProduct(id, '10.00');
      if (id === 'product-2') return buildCatalogProduct(id, '12.50', true, 'Pastel de carne');
      return null;
    },
    async existsById(id) {
      return id === 'product-1' || id === 'product-2';
    },
    async existsByName() {
      return false;
    },
    async save() {
      return 'product-id';
    },
    async update() {},
    async deleteById() {},
    ...overrides,
  };
}

export function createAdditionRepository(overrides: Partial<AdditionRepository> = {}): AdditionRepository {
  return {
    async findAdditionById(id) {
      if (id === 'addition-1') return buildCatalogAddition(id, '2.50');
      if (id === 'addition-2') return buildCatalogAddition(id, '1.00');
      return null;
    },
    async isLinkedToProduct() {
      return true;
    },
    async existsByName() {
      return false;
    },
    async save() {
      return 'addition-id';
    },
    async update() {},
    async deleteById() {},
    ...overrides,
  };
}

export function createCategoryRepository(overrides: Partial<CategoryRepository> = {}): CategoryRepository {
  return {
    async existsById(id) {
      return id === 'category-1';
    },
    async existsByName() {
      return false;
    },
    async save() {
      return 'category-id';
    },
    async update() {},
    async deleteById() {},
    ...overrides,
  };
}

export function buildCatalogProduct(
  id: string,
  price: string,
  available: boolean = true,
  name: string = 'Pastel de queijo',
): Product {
  return Product.create(
    ProductName.create(name),
    ProductPrice.create(DecimalValue.create(price)),
    ProductDescription.create('Preparado na hora'),
    ReferenceId.create('category-1', 'categoryId'),
    available,
    null,
    id,
  );
}

export function buildCatalogAddition(id: string, price: string, available: boolean = true): Addition {
  return Addition.create(
    AdditionName.create('Queijo extra'),
    AdditionPrice.create(DecimalValue.create(price)),
    available,
    id,
  );
}
