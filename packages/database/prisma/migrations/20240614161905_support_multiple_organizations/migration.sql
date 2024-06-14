/*
  Warnings:

  - The values [ORG_ADMIN] on the enum `RoleEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrganizationRoleEnum" AS ENUM ('ORG_ADMIN', 'ORG_MEMBER');

-- CreateEnum
CREATE TYPE "UserOrganizationStatus" AS ENUM ('ACTIVE', 'NON_ACTIVE', 'INVITED');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organization_id_fkey";

-- AlterTable
ALTER TABLE "users" RENAME COLUMN "organization_id" TO "last_logged_in_organization_id";

-- CreateTable
CREATE TABLE "user_organizations" (
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "role" "OrganizationRoleEnum" NOT NULL,
    "status" "UserOrganizationStatus" NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("user_id","organization_id")
);

-- CreateIndex
CREATE INDEX "users_last_logged_in_organization_id_idx" ON "users"("last_logged_in_organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_last_logged_in_organization_id_fkey" FOREIGN KEY ("last_logged_in_organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add user organizations
INSERT INTO user_organizations (user_id, organization_id, role, status)
SELECT id, last_logged_in_organization_id, 'ORG_ADMIN', 'ACTIVE'
FROM users
WHERE last_logged_in_organization_id IS NOT NULL;

-- Delete org admin roles
DELETE FROM user_roles
WHERE role = 'ORG_ADMIN';

-- AlterEnum
BEGIN;
CREATE TYPE "RoleEnum_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "user_roles" ALTER COLUMN "role" TYPE "RoleEnum_new" USING ("role"::text::"RoleEnum_new");
ALTER TYPE "RoleEnum" RENAME TO "RoleEnum_old";
ALTER TYPE "RoleEnum_new" RENAME TO "RoleEnum";
DROP TYPE "RoleEnum_old";
COMMIT;
