import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
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
import type { SseGateway } from '../../application/gateways/sse-gateway.js';

export class Server {
  private app = express();

  public constructor(
    private createUser: CreateUserController,
    private listUsers: ListUsersController,
    private deleteUser: DeleteUserController,
    private loginUser: LoginUserController,
    private createProduct: CreateProductController,
    private updateProduct: UpdateProductController,
    private deleteProduct: DeleteProductController,
    private createAddition: CreateAdditionController,
    private updateAddition: UpdateAdditionController,
    private deleteAddition: DeleteAdditionController,
    private listAdditions: ListAdditionsController,
    private listAdditionsByProduct: ListAdditionsByProductController,
    private createCategory: CreateCategoryController,
    private updateCategory: UpdateCategoryController,
    private deleteCategory: DeleteCategoryController,
    private listCategories: ListCategoriesController,
    private createTable: CreateTableController,
    private deleteTable: DeleteTableController,
    private listTables: ListTablesController,
    private listTableOrders: ListTableOrdersController,
    private listTableSessions: ListTableSessionsController,
    private listClosedTableSessions: ListClosedTableSessionsController,
    private removeTableOrder: RemoveTableOrderController,
    private releaseTable: ReleaseTableController,
    private store: StoreController,
    private listProductsByCategory: ListProductsByCategoryController,
    private listProducts: ListProductsController,
    private createOrder: CreateOrderController,
    private updateOrderStatus: UpdateOrderStatusController,
    private trackOrder: TrackOrderController,
    private listPendingOrders: ListPendingOrdersController,
    private listPreparingOrders: ListPreparingOrdersController,
    private listOrderHistory: ListOrderHistoryController,
    private sseGateway: SseGateway,
    private requireAuthentication: RequireAuthentication,
    private requireAdmin: RequireAdmin,
    private errorHandler: ErrorHandler,
  ) {
    this.app.use(express.json(), cors());
    this.routes();
    this.app.use(this.bindHandler(this.errorHandler));
  }

  public run(port: number = Number(process.env.PORT ?? 3000)): HttpServer {
    return this.app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  }

  private routes(): void {
    const authenticate = this.bindHandler(this.requireAuthentication);
    const authorizeAdmin = this.bindHandler(this.requireAdmin);

    this.registerUserRoutes(authenticate, authorizeAdmin);
    this.registerProductRoutes(authenticate, authorizeAdmin);
    this.registerAdditionRoutes(authenticate, authorizeAdmin);
    this.registerCategoryRoutes(authenticate, authorizeAdmin);
    this.registerTableRoutes(authenticate, authorizeAdmin);
    this.registerStoreRoutes(authenticate, authorizeAdmin);
    this.registerOrderRoutes(authenticate);
  }

  private registerUserRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/users', authenticate, authorizeAdmin, this.bindHandler(this.createUser));
    this.app.get('/users', authenticate, authorizeAdmin, this.bindHandler(this.listUsers));
    this.app.delete('/users/:userId', authenticate, authorizeAdmin, this.bindHandler(this.deleteUser));
    this.app.post('/login', this.bindHandler(this.loginUser));
  }

  private registerProductRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/products', authenticate, authorizeAdmin, this.bindHandler(this.createProduct));
    this.app.patch('/products/:productId', authenticate, authorizeAdmin, this.bindHandler(this.updateProduct));
    this.app.delete('/products/:productId', authenticate, authorizeAdmin, this.bindHandler(this.deleteProduct));
    this.app.get('/products', this.bindHandler(this.listProducts));
    this.app.get('/products/:productId/additions', this.bindHandler(this.listAdditionsByProduct));
  }

  private registerAdditionRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/additions', authenticate, authorizeAdmin, this.bindHandler(this.createAddition));
    this.app.patch('/additions/:additionId', authenticate, authorizeAdmin, this.bindHandler(this.updateAddition));
    this.app.delete('/additions/:additionId', authenticate, authorizeAdmin, this.bindHandler(this.deleteAddition));
    this.app.get('/additions', this.bindHandler(this.listAdditions));
  }

  private registerCategoryRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/categories', authenticate, authorizeAdmin, this.bindHandler(this.createCategory));
    this.app.patch('/categories/:categoryId', authenticate, authorizeAdmin, this.bindHandler(this.updateCategory));
    this.app.delete('/categories/:categoryId', authenticate, authorizeAdmin, this.bindHandler(this.deleteCategory));
    this.app.get('/categories', this.bindHandler(this.listCategories));
    this.app.get('/categories/:categoryId/products', this.bindHandler(this.listProductsByCategory));
  }

  private registerTableRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.post('/tables', authenticate, this.bindHandler(this.createTable));
    this.app.delete('/tables/:tableId', authenticate, this.bindHandler(this.deleteTable));
    this.app.get('/tables', authenticate, this.bindHandler(this.listTables));
    this.app.get('/tables/sessions/history', authenticate, authorizeAdmin, this.bindHandler(this.listClosedTableSessions));
    this.app.get('/tables/:tableId/orders', authenticate, this.bindHandler(this.listTableOrders));
    this.app.get('/tables/:tableId/sessions', authenticate, this.bindHandler(this.listTableSessions));
    this.app.delete('/tables/:tableId/orders/:orderId', authenticate, this.bindHandler(this.removeTableOrder));
    this.app.patch('/tables/:tableId/release', authenticate, this.bindHandler(this.releaseTable));
  }

  private registerStoreRoutes(authenticate: RequestHandler, authorizeAdmin: RequestHandler): void {
    this.app.get('/store/status', this.store.getStatus.bind(this.store));
    this.app.post('/store/open', authenticate, authorizeAdmin, this.store.open.bind(this.store));
    this.app.post('/store/close', authenticate, authorizeAdmin, this.store.close.bind(this.store));
  }

  private registerOrderRoutes(authenticate: RequestHandler): void {
    this.app.get('/store/events', this.connectStoreEvents.bind(this));
    this.app.get('/orders/events', authenticate, this.connectOrderEvents.bind(this));
    this.app.get('/orders/tracking/:trackingToken/events', this.connectTrackedOrderEvents.bind(this));
    this.app.post('/orders', this.authenticateTableOrder(authenticate), this.bindHandler(this.createOrder));
    this.app.patch('/orders/:orderId/status', authenticate, this.bindHandler(this.updateOrderStatus));
    this.app.get('/orders/pending', authenticate, this.bindHandler(this.listPendingOrders));
    this.app.get('/orders/preparing', authenticate, this.bindHandler(this.listPreparingOrders));
    this.app.get('/orders/history', authenticate, this.bindHandler(this.listOrderHistory));
    this.app.get('/orders/tracking/:trackingToken', this.bindHandler(this.trackOrder));
  }

  private connectStoreEvents(_request: Request, response: Response): void {
    this.sseGateway.connect(response, null, true);
  }

  private connectOrderEvents(_request: Request, response: Response): void {
    this.sseGateway.connect(response);
  }

  private async connectTrackedOrderEvents(request: Request, response: Response, next: NextFunction): Promise<void> {
    try {
      const orderId: string = await this.trackOrder.resolveOrderId(request.params.trackingToken as string);
      this.sseGateway.connect(response, orderId);
    } catch (error) {
      next(error);
    }
  }

  private authenticateTableOrder(authenticate: RequestHandler): RequestHandler {
    return (request, response, next) => {
      if (request.body?.tableId == null) {
        next();
        return;
      }
      return authenticate(request, response, next);
    };
  }

  private bindHandler<T extends { execute: (...args: never[]) => unknown }>(target: T): T['execute'] {
    return target.execute.bind(target);
  }
}
