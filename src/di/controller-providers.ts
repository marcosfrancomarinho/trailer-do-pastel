import { AppConfig } from '../../kit-dev/di/container.js';
import { CreateAdditionController } from '../infrastructure/http/controllers/additions/create-addition-controller.js';
import { DeleteAdditionController } from '../infrastructure/http/controllers/additions/delete-addition-controller.js';
import { ListAdditionsByProductController } from '../infrastructure/http/controllers/additions/list-additions-by-product-controller.js';
import { ListAdditionsController } from '../infrastructure/http/controllers/additions/list-additions-controller.js';
import { UpdateAdditionController } from '../infrastructure/http/controllers/additions/update-addition-controller.js';
import { CreateCategoryController } from '../infrastructure/http/controllers/categories/create-category-controller.js';
import { DeleteCategoryController } from '../infrastructure/http/controllers/categories/delete-category-controller.js';
import { ListCategoriesController } from '../infrastructure/http/controllers/categories/list-categories-controller.js';
import { UpdateCategoryController } from '../infrastructure/http/controllers/categories/update-category-controller.js';
import { CreateOrderController } from '../infrastructure/http/controllers/orders/create-order-controller.js';
import { ListOrderHistoryController } from '../infrastructure/http/controllers/orders/list-order-history-controller.js';
import { ListPendingOrdersController } from '../infrastructure/http/controllers/orders/list-pending-orders-controller.js';
import { ListPreparingOrdersController } from '../infrastructure/http/controllers/orders/list-preparing-orders-controller.js';
import { TrackOrderController } from '../infrastructure/http/controllers/orders/track-order-controller.js';
import { UpdateOrderStatusController } from '../infrastructure/http/controllers/orders/update-order-status-controller.js';
import { CreateProductController } from '../infrastructure/http/controllers/products/create-product-controller.js';
import { DeleteProductController } from '../infrastructure/http/controllers/products/delete-product-controller.js';
import { ListProductsByCategoryController } from '../infrastructure/http/controllers/products/list-products-by-category-controller.js';
import { ListProductsController } from '../infrastructure/http/controllers/products/list-products-controller.js';
import { UpdateProductController } from '../infrastructure/http/controllers/products/update-product-controller.js';
import { StoreController } from '../infrastructure/http/controllers/store/store-controller.js';
import { CreateTableController } from '../infrastructure/http/controllers/tables/create-table-controller.js';
import { DeleteTableController } from '../infrastructure/http/controllers/tables/delete-table-controller.js';
import { ListClosedTableSessionsController } from '../infrastructure/http/controllers/tables/list-closed-table-sessions-controller.js';
import { ListTableOrdersController } from '../infrastructure/http/controllers/tables/list-table-orders-controller.js';
import { ListTableSessionsController } from '../infrastructure/http/controllers/tables/list-table-sessions-controller.js';
import { ListTablesController } from '../infrastructure/http/controllers/tables/list-tables-controller.js';
import { ReleaseTableController } from '../infrastructure/http/controllers/tables/release-table-controller.js';
import { RemoveTableOrderController } from '../infrastructure/http/controllers/tables/remove-table-order-controller.js';
import { CreateUserController } from '../infrastructure/http/controllers/users/create-user-controller.js';
import { DeleteUserController } from '../infrastructure/http/controllers/users/delete-user-controller.js';
import { ListUsersController } from '../infrastructure/http/controllers/users/list-users-controller.js';
import { LoginUserController } from '../infrastructure/http/controllers/users/login-user-controller.js';

export const controllerProviders = new AppConfig()
  .useClass(UpdateOrderStatusController)
  .useClass(TrackOrderController)
  .useClass(CreateUserController)
  .useClass(ListUsersController)
  .useClass(DeleteUserController)
  .useClass(LoginUserController)
  .useClass(CreateAdditionController)
  .useClass(UpdateAdditionController)
  .useClass(DeleteAdditionController)
  .useClass(ListAdditionsController)
  .useClass(ListAdditionsByProductController)
  .useClass(CreateCategoryController)
  .useClass(CreateTableController)
  .useClass(DeleteTableController)
  .useClass(ListTablesController)
  .useClass(ListTableOrdersController)
  .useClass(ListTableSessionsController)
  .useClass(ListClosedTableSessionsController)
  .useClass(RemoveTableOrderController)
  .useClass(ReleaseTableController)
  .useClass(StoreController)
  .useClass(UpdateCategoryController)
  .useClass(DeleteCategoryController)
  .useClass(ListCategoriesController)
  .useClass(ListProductsController)
  .useClass(ListProductsByCategoryController)
  .useClass(CreateProductController)
  .useClass(UpdateProductController)
  .useClass(DeleteProductController)
  .useClass(CreateOrderController)
  .useClass(ListPendingOrdersController)
  .useClass(ListPreparingOrdersController)
  .useClass(ListOrderHistoryController);
