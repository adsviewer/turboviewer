/*
  Warnings:

  - The values [USER] on the enum `RoleEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `default_organization_id` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleEnum_new" AS ENUM ('ADMIN');
ALTER TABLE "user_roles" ALTER COLUMN "role" TYPE "RoleEnum_new" USING ("role"::text::"RoleEnum_new");
ALTER TYPE "RoleEnum" RENAME TO "RoleEnum_old";
ALTER TYPE "RoleEnum_new" RENAME TO "RoleEnum";
DROP TYPE "RoleEnum_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_default_organization_id_fkey";

-- DropIndex
DROP INDEX "users_default_organization_id_idx";

-- AlterTable
ALTER TABLE "users" RENAME COLUMN "default_organization_id" TO "current_organization_id";

-- CreateIndex
CREATE INDEX "users_current_organization_id_idx" ON "users"("current_organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_current_organization_id_fkey" FOREIGN KEY ("current_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
