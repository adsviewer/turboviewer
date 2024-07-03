-- AlterEnum
ALTER TYPE "OrganizationRoleEnum" ADD VALUE 'ORG_OPERATOR';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
