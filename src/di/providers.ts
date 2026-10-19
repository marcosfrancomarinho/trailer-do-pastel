import { PrismaClient } from '@prisma/client';
import { AppConfig, createApplicationContext } from '../../kit-dev/di/container.js';
import type { AuthTokenGateway } from '../application/gateways/auth-token-gateway.js';
import type { PasswordHasher } from '../application/gateways/password-hasher.js';
import type { CategoryQueries } from '../application/queries/category-queries.js';
import type { ProductQueries } from '../application/queries/product-queries.js';
import { CreateOrderItemAdditionService } from '../application/services/create-order-item-addition-service.js';
import { CreateOrderItemService } from '../application/services/create-order-item-service.js';
import { CreateAddition } from '../application/use-cases/create-addition.js';
import { CreateCategory } from '../application/use-cases/create-category.js';
import { CreateOrder } from '../application/use-cases/create-order.js';
import { CreateProduct } from '../application/use-cases/create-product.js';
import { CreateUser } from '../application/use-cases/create-user.js';
import { ListCategories } from '../application/use-cases/list-categories.js';
import { ListProductsByCategory } from '../application/use-cases/list-products-by-category.js';
import { LoginUser } from '../application/use-cases/login-user.js';
import type { AdditionRepository } from '../domain/repositories/addition-repository.js';
import type { CategoryRepository } from '../domain/repositories/category-repository.js';
import type { OrderRepository } from '../domain/repositories/order-repository.js';
import type { ProductRepository } from '../domain/repositories/product-repository.js';
import type { UserRepository } from '../domain/repositories/user-repository.js';
import { BcryptPasswordHasher } from '../infrastructure/gateways/bcrypt-password-hasher.js';
import { JwtAuthTokenGateway } from '../infrastructure/gateways/jwt-auth-token-gateway.js';
import { CreateAdditionController } from '../infrastructure/http/controllers/create-addition-controller.js';
import { CreateCategoryController } from '../infrastructure/http/controllers/create-category-controller.js';
import { CreateOrderController } from '../infrastructure/http/controllers/create-order-controller.js';
import { CreateProductController } from '../infrastructure/http/controllers/create-product-controller.js';
import { CreateUserController } from '../infrastructure/http/controllers/create-user-controller.js';
import { ListCategoriesController } from '../infrastructure/http/controllers/list-categories-controller.js';
import { ListProductsByCategoryController } from '../infrastructure/http/controllers/list-products-by-category-controller.js';
import { LoginUserController } from '../infrastructure/http/controllers/login-user-controller.js';
import { ErrorHandler } from '../infrastructure/http/middlewares/error-handler.js';
import { Server } from '../infrastructure/http/server.js';
import { PrismaCategoryQueries } from '../infrastructure/queries/prisma-category-queries.js';
import { PrismaProductQueries } from '../infrastructure/queries/prisma-product-queries.js';
import { PrismaAdditionRepository } from '../infrastructure/repositories/prisma-addition-repository.js';
import { PrismaCategoryRepository } from '../infrastructure/repositories/prisma-category-repository.js';
import { PrismaOrderRepository } from '../infrastructure/repositories/prisma-order-repository.js';
import { PrismaProductRepository } from '../infrastructure/repositories/prisma-product-repository.js';
import { PrismaUserRepository } from '../infrastructure/repositories/prisma-user-repository.js';
import { JWT_SECRET_TOKEN } from './tokens.js';

const providers = new AppConfig()
  .useFactory(PrismaClient, () => new PrismaClient())
  .useValue(JWT_SECRET_TOKEN, process.env.JWT_SECRET)
  .useClass<OrderRepository>(PrismaOrderRepository)
  .useClass<PasswordHasher>(BcryptPasswordHasher)
  .useClass<AuthTokenGateway>(JwtAuthTokenGateway, [JWT_SECRET_TOKEN])
  .useClass<UserRepository>(PrismaUserRepository)
  .useClass<AdditionRepository>(PrismaAdditionRepository)
  .useClass<CategoryRepository>(PrismaCategoryRepository)
  .useClass<CategoryQueries>(PrismaCategoryQueries)
  .useClass<ProductQueries>(PrismaProductQueries)
  .useClass<ProductRepository>(PrismaProductRepository)
  .useClass(CreateOrderItemAdditionService)
  .useClass(CreateOrderItemService)
  .useClass(CreateOrder)
  .useClass(CreateUser)
  .useClass(CreateUserController)
  .useClass(LoginUser)
  .useClass(LoginUserController)
  .useClass(ErrorHandler)
  .useClass(CreateAddition)
  .useClass(CreateAdditionController)
  .useClass(CreateCategory)
  .useClass(CreateCategoryController)
  .useClass(ListCategories)
  .useClass(ListCategoriesController)
  .useClass(ListProductsByCategory)
  .useClass(ListProductsByCategoryController)
  .useClass(CreateProduct)
  .useClass(CreateProductController)
  .useClass(CreateOrderController)
  .useClass(Server);

export const container = createApplicationContext(providers);
