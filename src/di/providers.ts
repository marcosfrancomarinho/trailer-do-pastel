import { PrismaClient } from '@prisma/client';
import { CreateOrder } from '../application/use-cases/create-order.js';
import { CreateOrderItemService } from '../application/services/create-order-item-service.js';
import { CreateOrderItemAdditionService } from '../application/services/create-order-item-addition-service.js';
import type { OrderRepository } from '../domain/repositories/order-repository.js';
import { PrismaOrderRepository } from '../infrastructure/repositories/prisma-order-repository.js';
import { CreateUser } from '../application/use-cases/create-user.js';
import type { PasswordHasher } from '../application/gateways/password-hasher.js';
import type { UserRepository } from '../domain/repositories/user-repository.js';
import { BcryptPasswordHasher } from '../infrastructure/gateways/bcrypt-password-hasher.js';
import { PrismaUserRepository } from '../infrastructure/repositories/prisma-user-repository.js';
import { CreateUserController } from '../infrastructure/http/controllers/create-user-controller.js';
import { CreateProductController } from '../infrastructure/http/controllers/create-product-controller.js';
import { CreateAdditionController } from '../infrastructure/http/controllers/create-addition-controller.js';
import { CreateOrderController } from '../infrastructure/http/controllers/create-order-controller.js';
import { ErrorHandler } from '../infrastructure/http/middlewares/error-handler.js';
import { Server } from '../infrastructure/http/server.js';
import { CreateAddition } from '../application/use-cases/create-addition.js';
import type { AdditionRepository } from '../domain/repositories/addition-repository.js';
import { PrismaAdditionRepository } from '../infrastructure/repositories/prisma-addition-repository.js';
import { CreateProduct } from '../application/use-cases/create-product.js';
import type { ProductRepository } from '../domain/repositories/product-repository.js';
import { PrismaProductRepository } from '../infrastructure/repositories/prisma-product-repository.js';
import { AppConfig, createApplicationContext } from '../../kit-dev/di/container.js';

const providers = new AppConfig()
  .useFactory(PrismaClient, () => new PrismaClient())
  .useClass<OrderRepository>(PrismaOrderRepository)
  .useClass<PasswordHasher>(BcryptPasswordHasher)
  .useClass<UserRepository>(PrismaUserRepository)
  .useClass<AdditionRepository>(PrismaAdditionRepository)
  .useClass<ProductRepository>(PrismaProductRepository)
  .useClass(CreateOrderItemAdditionService)
  .useClass(CreateOrderItemService)
  .useClass(CreateOrder)
  .useClass(CreateUser)
  .useClass(CreateUserController)
  .useClass(ErrorHandler)
  .useClass(CreateAddition)
  .useClass(CreateAdditionController)
  .useClass(CreateProduct)
  .useClass(CreateProductController)
  .useClass(CreateOrderController)
  .useClass(Server);

export const container = createApplicationContext(providers);
