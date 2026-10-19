import { PrismaClient } from '@prisma/client';
import { AppConfig, createApplicationContext } from '../../kit-dev/di/container.js';
import type { AuthTokenGateway } from '../application/gateways/auth-token-gateway.js';
import type { PasswordHasher } from '../application/gateways/password-hasher.js';
import type { AdditionQueries } from '../application/queries/addition-queries.js';
import type { CategoryQueries } from '../application/queries/category-queries.js';
import type { ProductQueries } from '../application/queries/product-queries.js';
import { CreateOrderItemAdditionService } from '../application/services/create-order-item-addition-service.js';
import { CreateOrderItemService } from '../application/services/create-order-item-service.js';
import { CreateAddition } from '../application/use-cases/additions/create-addition.js';
import { CreateCategory } from '../application/use-cases/categories/create-category.js';
import { CreateOrder } from '../application/use-cases/orders/create-order.js';
import { CreateProduct } from '../application/use-cases/products/create-product.js';
import { CreateUser } from '../application/use-cases/users/create-user.js';
import { ListCategories } from '../application/use-cases/categories/list-categories.js';
import { ListAdditions } from '../application/use-cases/additions/list-additions.js';
import { ListAdditionsByProduct } from '../application/use-cases/additions/list-additions-by-product.js';
import { ListProducts } from '../application/use-cases/products/list-products.js';
import { ListProductsByCategory } from '../application/use-cases/products/list-products-by-category.js';
import { LoginUser } from '../application/use-cases/users/login-user.js';
import type { AdditionRepository } from '../domain/repositories/addition-repository.js';
import type { CategoryRepository } from '../domain/repositories/category-repository.js';
import type { OrderRepository } from '../domain/repositories/order-repository.js';
import type { ProductRepository } from '../domain/repositories/product-repository.js';
import type { UserRepository } from '../domain/repositories/user-repository.js';
import { BcryptPasswordHasher } from '../infrastructure/gateways/bcrypt-password-hasher.js';
import { JwtAuthTokenGateway } from '../infrastructure/gateways/jwt-auth-token-gateway.js';
import { CreateAdditionController } from '../infrastructure/http/controllers/additions/create-addition-controller.js';
import { CreateCategoryController } from '../infrastructure/http/controllers/categories/create-category-controller.js';
import { CreateOrderController } from '../infrastructure/http/controllers/orders/create-order-controller.js';
import { CreateProductController } from '../infrastructure/http/controllers/products/create-product-controller.js';
import { CreateUserController } from '../infrastructure/http/controllers/users/create-user-controller.js';
import { ListCategoriesController } from '../infrastructure/http/controllers/categories/list-categories-controller.js';
import { ListAdditionsController } from '../infrastructure/http/controllers/additions/list-additions-controller.js';
import { ListAdditionsByProductController } from '../infrastructure/http/controllers/additions/list-additions-by-product-controller.js';
import { ListProductsByCategoryController } from '../infrastructure/http/controllers/products/list-products-by-category-controller.js';
import { ListProductsController } from '../infrastructure/http/controllers/products/list-products-controller.js';
import { LoginUserController } from '../infrastructure/http/controllers/users/login-user-controller.js';
import { ErrorHandler } from '../infrastructure/http/middlewares/error-handler.js';
import { RequireAuthentication } from '../infrastructure/http/middlewares/require-authentication.js';
import { Server } from '../infrastructure/http/server.js';
import { PrismaCategoryQueries } from '../infrastructure/queries/prisma-category-queries.js';
import { PrismaAdditionQueries } from '../infrastructure/queries/prisma-addition-queries.js';
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
  .useClass<AdditionQueries>(PrismaAdditionQueries)
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
  .useClass(RequireAuthentication)
  .useClass(CreateAddition)
  .useClass(CreateAdditionController)
  .useClass(ListAdditions)
  .useClass(ListAdditionsController)
  .useClass(ListAdditionsByProduct)
  .useClass(ListAdditionsByProductController)
  .useClass(CreateCategory)
  .useClass(CreateCategoryController)
  .useClass(ListCategories)
  .useClass(ListCategoriesController)
  .useClass(ListProducts)
  .useClass(ListProductsController)
  .useClass(ListProductsByCategory)
  .useClass(ListProductsByCategoryController)
  .useClass(CreateProduct)
  .useClass(CreateProductController)
  .useClass(CreateOrderController)
  .useClass(Server);

export const container = createApplicationContext(providers);
