import express from 'express';
import cors from 'cors';
import type { Server as HttpServer } from 'node:http';
import { CreateUserController } from './controllers/create-user-controller.js';
import { LoginUserController } from './controllers/login-user-controller.js';
import { CreateProductController } from './controllers/create-product-controller.js';
import { CreateAdditionController } from './controllers/create-addition-controller.js';
import { CreateCategoryController } from './controllers/create-category-controller.js';
import { ListCategoriesController } from './controllers/list-categories-controller.js';
import { ListProductsByCategoryController } from './controllers/list-products-by-category-controller.js';
import { CreateOrderController } from './controllers/create-order-controller.js';
import { ErrorHandler } from './middlewares/error-handler.js';

export class Server {
  private readonly app = express();

  public constructor(
    private readonly createUserController: CreateUserController,
    private readonly loginUserController: LoginUserController,
    private readonly createProductController: CreateProductController,
    private readonly createAdditionController: CreateAdditionController,
    private readonly createCategoryController: CreateCategoryController,
    private readonly listCategoriesController: ListCategoriesController,
    private readonly listProductsByCategoryController: ListProductsByCategoryController,
    private readonly createOrderController: CreateOrderController,
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
    this.app.post('/additions', this.createAdditionController.execute.bind(this.createAdditionController));
    this.app.post('/categories', this.createCategoryController.execute.bind(this.createCategoryController));
    this.app.get('/categories', this.listCategoriesController.execute.bind(this.listCategoriesController));
    this.app.get(
      '/categories/:categoryId/products',
      this.listProductsByCategoryController.execute.bind(this.listProductsByCategoryController),
    );
    this.app.post('/orders', this.createOrderController.execute.bind(this.createOrderController));
  }
}
