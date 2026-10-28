import { AppConfig } from '../../kit-dev/di/container.js';
import { PrismaClient } from '@prisma/client';
import type { AuthTokenGateway } from '../application/gateways/auth-token-gateway.js';
import type { PasswordHasher } from '../application/gateways/password-hasher.js';
import type { SseGateway } from '../application/gateways/sse-gateway.js';
import type { AdditionQueries } from '../application/queries/addition-queries.js';
import type { CategoryQueries } from '../application/queries/category-queries.js';
import type { OrderQueries } from '../application/queries/order-queries.js';
import type { ProductQueries } from '../application/queries/product-queries.js';
import type { TableOrderQueries } from '../application/queries/table-order-queries.js';
import type { TableQueries } from '../application/queries/table-queries.js';
import type { UserQueries } from '../application/queries/user-queries.js';
import type { AdditionRepository } from '../domain/repositories/addition-repository.js';
import type { CategoryRepository } from '../domain/repositories/category-repository.js';
import type { OrderRepository } from '../domain/repositories/order-repository.js';
import type { ProductRepository } from '../domain/repositories/product-repository.js';
import type { StoreRepository } from '../domain/repositories/store-repository.js';
import type { TableRepository } from '../domain/repositories/table-repository.js';
import type { UserRepository } from '../domain/repositories/user-repository.js';
import { BcryptPasswordHasher } from '../infrastructure/gateways/bcrypt-password-hasher.js';
import { JwtAuthTokenGateway } from '../infrastructure/gateways/jwt-auth-token-gateway.js';
import { HttpSseGateway } from '../infrastructure/http/gateways/http-sse-gateway.js';
import { ErrorHandler } from '../infrastructure/http/middlewares/error-handler.js';
import { RequireAdmin } from '../infrastructure/http/middlewares/require-admin.js';
import { RequireAuthentication } from '../infrastructure/http/middlewares/require-authentication.js';
import { Server } from '../infrastructure/http/server.js';
import { PrismaAdditionQueries } from '../infrastructure/queries/prisma-addition-queries.js';
import { PrismaCategoryQueries } from '../infrastructure/queries/prisma-category-queries.js';
import { PrismaOrderQueries } from '../infrastructure/queries/prisma-order-queries.js';
import { PrismaTableOrderQueries } from '../infrastructure/queries/prisma-table-order-queries.js';
import { PrismaProductQueries } from '../infrastructure/queries/prisma-product-queries.js';
import { PrismaTableQueries } from '../infrastructure/queries/prisma-table-queries.js';
import { PrismaUserQueries } from '../infrastructure/queries/prisma-user-queries.js';
import { PrismaAdditionRepository } from '../infrastructure/repositories/prisma-addition-repository.js';
import { PrismaCategoryRepository } from '../infrastructure/repositories/prisma-category-repository.js';
import { PrismaOrderRepository } from '../infrastructure/repositories/prisma-order-repository.js';
import { PrismaProductRepository } from '../infrastructure/repositories/prisma-product-repository.js';
import { PrismaStoreRepository } from '../infrastructure/repositories/prisma-store-repository.js';
import { PrismaTableRepository } from '../infrastructure/repositories/prisma-table-repository.js';
import { PrismaUserRepository } from '../infrastructure/repositories/prisma-user-repository.js';
import { JWT_SECRET_TOKEN } from './tokens.js';

export const infrastructureProviders = new AppConfig()
  .useValue(JWT_SECRET_TOKEN, process.env.JWT_SECRET)
  .useFactory(PrismaClient, () => new PrismaClient())
  .useClass<OrderRepository>(PrismaOrderRepository)
  .useClass<PasswordHasher>(BcryptPasswordHasher)
  .useClass<AuthTokenGateway>(JwtAuthTokenGateway, [JWT_SECRET_TOKEN])
  .useClass<SseGateway>(HttpSseGateway)
  .useClass<UserRepository>(PrismaUserRepository)
  .useClass<AdditionRepository>(PrismaAdditionRepository)
  .useClass<CategoryRepository>(PrismaCategoryRepository)
  .useClass<TableRepository>(PrismaTableRepository)
  .useClass<StoreRepository>(PrismaStoreRepository)
  .useClass<CategoryQueries>(PrismaCategoryQueries)
  .useClass<AdditionQueries>(PrismaAdditionQueries)
  .useClass<ProductQueries>(PrismaProductQueries)
  .useClass<OrderQueries>(PrismaOrderQueries)
  .useClass<TableOrderQueries>(PrismaTableOrderQueries)
  .useClass<TableQueries>(PrismaTableQueries)
  .useClass<UserQueries>(PrismaUserQueries)
  .useClass<ProductRepository>(PrismaProductRepository)
  .useClass(ErrorHandler)
  .useClass(RequireAuthentication)
  .useClass(RequireAdmin)
  .useClass(Server);
