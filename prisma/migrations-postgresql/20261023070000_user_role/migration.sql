CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EMPLOYEE');

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE';

-- A conta ADMIN será criada ou promovida manualmente pelo proprietário.
CREATE UNIQUE INDEX "users_single_admin_idx" ON "users" ((1)) WHERE "role" = 'ADMIN';
