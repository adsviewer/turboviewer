/*
  Warnings:

  - The values [NON_ACTIVE] on the enum `UserOrganizationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserOrganizationStatus_new" AS ENUM ('ACTIVE', 'INVITED');
ALTER TABLE "user_organizations" ALTER COLUMN "status" TYPE "UserOrganizationStatus_new" USING ("status"::text::"UserOrganizationStatus_new");
ALTER TYPE "UserOrganizationStatus" RENAME TO "UserOrganizationStatus_old";
ALTER TYPE "UserOrganizationStatus_new" RENAME TO "UserOrganizationStatus";
DROP TYPE "UserOrganizationStatus_old";
COMMIT;
