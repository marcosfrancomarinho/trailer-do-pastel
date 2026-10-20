import express from 'express';
import cors from 'cors';
import type { Server as HttpServer } from 'node:http';
import { CreateUserController } from './controllers/users/create-user-controller.js';
import { LoginUserController } from './controllers/users/login-user-controller.js';
import { CreateProductController } from './controllers/products/create-product-controller.js';
import { UpdateProductController } from './controllers/products/update-product-controller.js';
import { CreateAdditionController } from './controllers/additions/create-addition-controller.js';
import { ListAdditionsController } from './controllers/additions/list-additions-controller.js';
import { ListAdditionsByProductController } from './controllers/additions/list-additions-by-product-controller.js';
import { CreateCategoryController } from './controllers/categories/create-category-controller.js';
import { ListCategoriesController } from './controllers/categories/list-categories-controller.js';
import { ListProductsByCategoryController } from './controllers/products/list-products-by-category-controller.js';
import { ListProductsController } from './controllers/products/list-products-controller.js';
import { CreateOrderController } from './controllers/orders/create-order-controller.js';
import { ListPendingOrdersController } from './controllers/orders/list-pending-orders-controller.js';
import { ErrorHandler } from './middlewares/error-handler.js';

export class Server {
  private readonly app = express();

  public constructor(
    private readonly createUserController: CreateUserController,
    private readonly loginUserController: LoginUserController,
    private readonly createProductController: CreateProductController,
    private readonly updateProductController: UpdateProductController,
    private readonly createAdditionController: CreateAdditionController,
    private readonly listAdditionsController: ListAdditionsController,
    private readonly listAdditionsByProductController: ListAdditionsByProductController,
    private readonly createCategoryController: CreateCategoryController,
    private readonly listCategoriesController: ListCategoriesController,
    private readonly listProductsByCategoryController: ListProductsByCategoryController,
    private readonly listProductsController: ListProductsController,
    private readonly createOrderController: CreateOrderController,
    private readonly listPendingOrdersController: ListPendingOrdersController,
    private readonly errorHandler: ErrorHandler,
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
    this.app.post('/users', this.createUserController.execute.bind(this.createUserController));
    this.app.post('/login', this.loginUserController.execute.bind(this.loginUserController));
    this.app.post('/products', this.createProductController.execute.bind(this.createProductController));
    this.app.patch('/products/:productId', this.updateProductController.execute.bind(this.updateProductController));
    this.app.get('/products', this.listProductsController.execute.bind(this.listProductsController));
    this.app.get(
      '/products/:productId/additions',
      this.listAdditionsByProductController.execute.bind(this.listAdditionsByProductController),
    );
    this.app.post('/additions', this.createAdditionController.execute.bind(this.createAdditionController));
    this.app.get('/additions', this.listAdditionsController.execute.bind(this.listAdditionsController));
    this.app.post('/categories', this.createCategoryController.execute.bind(this.createCategoryController));
    this.app.get('/categories', this.listCategoriesController.execute.bind(this.listCategoriesController));
    this.app.get(
      '/categories/:categoryId/products',
      this.listProductsByCategoryController.execute.bind(this.listProductsByCategoryController),
    );
    this.app.post('/orders', this.createOrderController.execute.bind(this.createOrderController));
    this.app.get('/orders/pending', this.listPendingOrdersController.execute.bind(this.listPendingOrdersController));
  }
}
