import { AppConfig } from '../../kit-dev/di/container.js';
import { EventObserver } from '../application/observer/event-observer.js';
import { SseListener } from '../application/listeners/sse-listener.js';
import { CreateOrderItemAdditionService } from '../application/services/create-order-item-addition-service.js';
import { CreateOrderItemService } from '../application/services/create-order-item-service.js';
import { CreateAddition } from '../application/use-cases/additions/create-addition.js';
import { DeleteAddition } from '../application/use-cases/additions/delete-addition.js';
import { ListAdditionsByProduct } from '../application/use-cases/additions/list-additions-by-product.js';
import { ListAdditions } from '../application/use-cases/additions/list-additions.js';
import { UpdateAddition } from '../application/use-cases/additions/update-addition.js';
import { CreateCategory } from '../application/use-cases/categories/create-category.js';
import { DeleteCategory } from '../application/use-cases/categories/delete-category.js';
import { ListCategories } from '../application/use-cases/categories/list-categories.js';
import { UpdateCategory } from '../application/use-cases/categories/update-category.js';
import { CreateOrder } from '../application/use-cases/orders/create-order.js';
import { ListOrderHistory } from '../application/use-cases/orders/list-order-history.js';
import { ListPendingOrders } from '../application/use-cases/orders/list-pending-orders.js';
import { ListPreparingOrders } from '../application/use-cases/orders/list-preparing-orders.js';
import { TrackOrder } from '../application/use-cases/orders/track-order.js';
import { ResolveOrderId } from '../application/use-cases/orders/resolve-order-id.js';
import { UpdateOrderStatus } from '../application/use-cases/orders/update-order-status.js';
import { CreateProduct } from '../application/use-cases/products/create-product.js';
import { DeleteProduct } from '../application/use-cases/products/delete-product.js';
import { ListProductsByCategory } from '../application/use-cases/products/list-products-by-category.js';
import { ListProducts } from '../application/use-cases/products/list-products.js';
import { UpdateProduct } from '../application/use-cases/products/update-product.js';
import { GetStoreStatus } from '../application/use-cases/store/get-store-status.js';
import { SetStoreStatus } from '../application/use-cases/store/set-store-status.js';
import { CreateTable } from '../application/use-cases/tables/create-table.js';
import { DeleteTable } from '../application/use-cases/tables/delete-table.js';
import { ListClosedTableSessions } from '../application/use-cases/tables/list-closed-table-sessions.js';
import { ListTableOrders } from '../application/use-cases/tables/list-table-orders.js';
import { ListTableSessions } from '../application/use-cases/tables/list-table-sessions.js';
import { ListTables } from '../application/use-cases/tables/list-tables.js';
import { ReleaseTable } from '../application/use-cases/tables/release-table.js';
import { RemoveTableOrder } from '../application/use-cases/tables/remove-table-order.js';
import { CreateUser } from '../application/use-cases/users/create-user.js';
import { DeleteUser } from '../application/use-cases/users/delete-user.js';
import { ListUsers } from '../application/use-cases/users/list-users.js';
import { LoginUser } from '../application/use-cases/users/login-user.js';

export const applicationProviders = new AppConfig()
  .useFactory(EventObserver, (context) => {
    const observer = new EventObserver();
    observer.register(context.get(SseListener));
    return observer;
  })
  .useClass(CreateOrderItemAdditionService)
  .useClass(SseListener)
  .useClass(CreateOrderItemService)
  .useClass(CreateOrder)
  .useClass(UpdateOrderStatus)
  .useClass(TrackOrder)
  .useClass(ResolveOrderId)
  .useClass(ListPendingOrders)
  .useClass(ListPreparingOrders)
  .useClass(ListOrderHistory)
  .useClass(CreateUser)
  .useClass(ListUsers)
  .useClass(DeleteUser)
  .useClass(LoginUser)
  .useClass(CreateAddition)
  .useClass(UpdateAddition)
  .useClass(DeleteAddition)
  .useClass(ListAdditions)
  .useClass(ListAdditionsByProduct)
  .useClass(CreateCategory)
  .useClass(CreateTable)
  .useClass(DeleteTable)
  .useClass(ListTables)
  .useClass(ListTableOrders)
  .useClass(ListTableSessions)
  .useClass(ListClosedTableSessions)
  .useClass(RemoveTableOrder)
  .useClass(ReleaseTable)
  .useClass(GetStoreStatus)
  .useClass(SetStoreStatus)
  .useClass(UpdateCategory)
  .useClass(DeleteCategory)
  .useClass(ListCategories)
  .useClass(ListProducts)
  .useClass(ListProductsByCategory)
  .useClass(CreateProduct)
  .useClass(UpdateProduct)
  .useClass(DeleteProduct);
