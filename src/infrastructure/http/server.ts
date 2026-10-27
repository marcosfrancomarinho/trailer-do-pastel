import express, { type RequestHandler } from 'express';
import cors from 'cors';
import type { Server as HttpServer } from 'node:http';
import { CreateUserController } from './controllers/users/create-user-controller.js';
import { ListUsersController } from './controllers/users/list-users-controller.js';
import { DeleteUserController } from './controllers/users/delete-user-controller.js';
import { LoginUserController } from './controllers/users/login-user-controller.js';
import { CreateProductController } from './controllers/products/create-product-controller.js';
import { UpdateProductController } from './controllers/products/update-product-controller.js';
import { DeleteProductController } from './controllers/products/delete-product-controller.js';
import { CreateAdditionController } from './controllers/additions/create-addition-controller.js';
import { UpdateAdditionController } from './controllers/additions/update-addition-controller.js';
import { DeleteAdditionController } from './controllers/additions/delete-addition-controller.js';
import { ListAdditionsController } from './controllers/additions/list-additions-controller.js';
import { ListAdditionsByProductController } from './controllers/additions/list-additions-by-product-controller.js';
import { CreateCategoryController } from './controllers/categories/create-category-controller.js';
import { UpdateCategoryController } from './controllers/categories/update-category-controller.js';
import { DeleteCategoryController } from './controllers/categories/delete-category-controller.js';
import { ListCategoriesController } from './controllers/categories/list-categories-controller.js';
import { CreateTableController } from './controllers/tables/create-table-controller.js';
import { DeleteTableController } from './controllers/tables/delete-table-controller.js';
import { ListTablesController } from './controllers/tables/list-tables-controller.js';
import { ListTableOrdersController } from './controllers/tables/list-table-orders-controller.js';
import { ListClosedTableSessionsController } from './controllers/tables/list-closed-table-sessions-controller.js';
import { ListTableSessionsController } from './controllers/tables/list-table-sessions-controller.js';
import { RemoveTableOrderController } from './controllers/tables/remove-table-order-controller.js';
import { ReleaseTableController } from './controllers/tables/release-table-controller.js';
import { StoreController } from './controllers/store/store-controller.js';
import { ListProductsByCategoryController } from './controllers/products/list-products-by-category-controller.js';
import { ListProductsController } from './controllers/products/list-products-controller.js';
import { CreateOrderController } from './controllers/orders/create-order-controller.js';
import { UpdateOrderStatusController } from './controllers/orders/update-order-status-controller.js';
import { TrackOrderController } from './controllers/orders/track-order-controller.js';
import { ListPendingOrdersController } from './controllers/orders/list-pending-orders-controller.js';
import { ListPreparingOrdersController } from './controllers/orders/list-preparing-orders-controller.js';
import { ListOrderHistoryController } from './controllers/orders/list-order-history-controller.js';
import { ErrorHandler } from './middlewares/error-handler.js';
import { RequireAuthentication } from './middlewares/require-authentication.js';
import { RequireAdmin } from './middlewares/require-admin.js';
import { HttpSseGateway } from './gateways/http-sse-gateway.js';

export class Server {
  private app = express();

  public constructor(
    private createUserController: CreateUserController,
    private listUsersController: ListUsersController,
    private deleteUserController: DeleteUserController,
    private loginUserController: LoginUserController,
    private createProductController: CreateProductController,
    private updateProductController: UpdateProductController,
    private deleteProductController: DeleteProductController,
    private createAdditionController: CreateAdditionController,
    private updateAdditionController: UpdateAdditionController,
    private deleteAdditionController: DeleteAdditionController,
    private listAdditionsController: ListAdditionsController,
    private listAdditionsByProductController: ListAdditionsByProductController,
    private createCategoryController: CreateCategoryController,
    private updateCategoryController: UpdateCategoryController,
    private deleteCategoryController: DeleteCategoryController,
    private listCategoriesController: ListCategoriesController,
    private createTableController: CreateTableController,
    private deleteTableController: DeleteTableController,
    private listTablesController: ListTablesController,
    private listTableOrdersController: ListTableOrdersController,
    private listTableSessionsController: ListTableSessionsController,
    private listClosedTableSessionsController: ListClosedTableSessionsController,
    private removeTableOrderController: RemoveTableOrderController,
    private releaseTableController: ReleaseTableController,
    private storeController: StoreController,
    private listProductsByCategoryController: ListProductsByCategoryController,
    private listProductsController: ListProductsController,
    private createOrderController: CreateOrderController,
    private updateOrderStatusController: UpdateOrderStatusController,
    private trackOrderController: TrackOrderController,
    private listPendingOrdersController: ListPendingOrdersController,
    private listPreparingOrdersController: ListPreparingOrdersController,
    private listOrderHistoryController: ListOrderHistoryController,
    private sseGateway: HttpSseGateway,
    private requireAuthentication: RequireAuthentication,
    private requireAdmin: RequireAdmin,
    private errorHandler: ErrorHandler,
  ) {
    this.app.use(express.json(), cors());
    this.routes();
    this.app.use(this.errorHandler.execute.bind(this.errorHandler));
  }

  public run(port: number = Number(process.env.PORT ?? 3000)): HttpServer {
    return this.app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  }

  private routes(): void {
    const authenticate = this.requireAuthentication.execute.bind(this.requireAuthentication);
    const authorizeAdmin = this.requireAdmin.execute.bind(this.requireAdmin);

    this.registerUserRoutes(authenticate, authorizeAdmin);
    this.registerProductRoutes(authenticate, authorizeAdmin);
    this.registerAdditionRoutes(authenticate, authorizeAdmin);
    this.registerCategoryRoutes(authenticate, authorizeAdmin);
    this.registerTableRoutes(authenticate, authorizeAdmin);
    this.registerStoreRoutes(authenticate, authorizeAdmin);
    this.registerOrderRoutes(authenticate);
  }

  private registerUserRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/users', authenticate, authorizeAdmin, this.createUserController.execute.bind(this.createUserController));
    this.app.get('/users', authenticate, authorizeAdmin, this.listUsersController.execute.bind(this.listUsersController));
    this.app.delete('/users/:userId', authenticate, authorizeAdmin, this.deleteUserController.execute.bind(this.deleteUserController));
    this.app.post('/login', this.loginUserController.execute.bind(this.loginUserController));
  }

  private registerProductRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/products', authenticate, authorizeAdmin, this.createProductController.execute.bind(this.createProductController));
    this.app.patch(
      '/products/:productId',
      authenticate, authorizeAdmin, this.updateProductController.execute.bind(this.updateProductController),
    );
    this.app.delete(
      '/products/:productId',
      authenticate, authorizeAdmin, this.deleteProductController.execute.bind(this.deleteProductController),
    );
    this.app.get('/products', this.listProductsController.execute.bind(this.listProductsController));
    this.app.get(
      '/products/:productId/additions',
      this.listAdditionsByProductController.execute.bind(this.listAdditionsByProductController),
    );
  }

  private registerAdditionRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post(
      '/additions',
      authenticate, authorizeAdmin, this.createAdditionController.execute.bind(this.createAdditionController),
    );
    this.app.patch(
      '/additions/:additionId',
      authenticate, authorizeAdmin, this.updateAdditionController.execute.bind(this.updateAdditionController),
    );
    this.app.delete(
      '/additions/:additionId',
      authenticate, authorizeAdmin, this.deleteAdditionController.execute.bind(this.deleteAdditionController),
    );
    this.app.get('/additions', this.listAdditionsController.execute.bind(this.listAdditionsController));
  }

  private registerCategoryRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post(
      '/categories',
      authenticate, authorizeAdmin, this.createCategoryController.execute.bind(this.createCategoryController),
    );
    this.app.patch(
      '/categories/:categoryId',
      authenticate, authorizeAdmin, this.updateCategoryController.execute.bind(this.updateCategoryController),
    );
    this.app.delete(
      '/categories/:categoryId',
      authenticate, authorizeAdmin, this.deleteCategoryController.execute.bind(this.deleteCategoryController),
    );
    this.app.get('/categories', this.listCategoriesController.execute.bind(this.listCategoriesController));
    this.app.get(
      '/categories/:categoryId/products',
      this.listProductsByCategoryController.execute.bind(this.listProductsByCategoryController),
    );
  }

  private registerOrderRoutes(authenticate: RequestHandler): void {
    this.app.get('/store/events', (_request, response) => {
      this.sseGateway.connect(response, null, true);
    });
    this.app.get('/orders/events', authenticate, (_request, response) => {
      this.sseGateway.connect(response);
    });
    // Canal público limitado ao pedido autorizado pelo token de acompanhamento.
    this.app.get('/orders/tracking/:trackingToken/events', async (request, response, next) => {
      try {
        const orderId = await this.trackOrderController.resolveOrderId(request.params.trackingToken as string);
        this.sseGateway.connect(response, orderId);
      } catch (error) {
        next(error);
      }
    });

    const authenticateTableOrder: RequestHandler = (request, response, next) => {
      if (request.body?.tableId == null) {
        next();
        return;
      }
      return authenticate(request, response, next);
    };
    this.app.post('/orders', authenticateTableOrder, this.createOrderController.execute.bind(this.createOrderController));
    this.app.patch(
      '/orders/:orderId/status',
      authenticate,
      this.updateOrderStatusController.execute.bind(this.updateOrderStatusController),
    );
    this.app.get(
      '/orders/pending',
      authenticate,
      this.listPendingOrdersController.execute.bind(this.listPendingOrdersController),
    );
    this.app.get(
      '/orders/preparing',
      authenticate,
      this.listPreparingOrdersController.execute.bind(this.listPreparingOrdersController),
    );
    this.app.get(
      '/orders/history',
      authenticate,
      this.listOrderHistoryController.execute.bind(this.listOrderHistoryController),
    );
    this.app.get(
      '/orders/tracking/:trackingToken',
      this.trackOrderController.execute.bind(this.trackOrderController),
    );
  }

  private registerTableRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/tables', authenticate, this.createTableController.execute.bind(this.createTableController));
    this.app.delete('/tables/:tableId', authenticate, this.deleteTableController.execute.bind(this.deleteTableController));
    this.app.get('/tables', authenticate, this.listTablesController.execute.bind(this.listTablesController));
    this.app.get('/tables/sessions/history', authenticate, authorizeAdmin, this.listClosedTableSessionsController.execute.bind(this.listClosedTableSessionsController));
    this.app.get(
      '/tables/:tableId/orders',
      authenticate,
      this.listTableOrdersController.execute.bind(this.listTableOrdersController),
    );
    this.app.get(
      '/tables/:tableId/sessions',
      authenticate,
      this.listTableSessionsController.execute.bind(this.listTableSessionsController),
    );
    this.app.delete(
      '/tables/:tableId/orders/:orderId',
      authenticate,
      this.removeTableOrderController.execute.bind(this.removeTableOrderController),
    );
    this.app.patch(
      '/tables/:tableId/release',
      authenticate,
      this.releaseTableController.execute.bind(this.releaseTableController),
    );
  }

  private registerStoreRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.get('/store/status', this.storeController.getStatus.bind(this.storeController));
    this.app.post('/store/open', authenticate, authorizeAdmin, this.storeController.open.bind(this.storeController));
    this.app.post('/store/close', authenticate, authorizeAdmin, this.storeController.close.bind(this.storeController));
  }
}
