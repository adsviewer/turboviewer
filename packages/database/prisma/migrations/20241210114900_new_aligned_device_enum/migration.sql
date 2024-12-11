/*
  Warnings:

  - The values [Unspacified] on the enum `DeviceEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeviceEnum_new" AS ENUM ('MobileWeb', 'MobileApp', 'Desktop', 'ConnectedTv', 'Tablet', 'Unknown');
ALTER TABLE "insights" ALTER COLUMN "device" TYPE "DeviceEnum_new" USING ("device"::text::"DeviceEnum_new");
ALTER TYPE "DeviceEnum" RENAME TO "DeviceEnum_old";
ALTER TYPE "DeviceEnum_new" RENAME TO "DeviceEnum";
DROP TYPE "DeviceEnum_old";
COMMIT;
