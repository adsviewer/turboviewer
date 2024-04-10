/*
  Warnings:

  - A unique constraint covering the columns `[external_id,type]` on the table `integrations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `status` to the `integrations` table without a default value. This is not possible if the table is not empty.
  - Made the column `external_id` on table `integrations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'REVOKED');

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "status" "IntegrationStatus" NOT NULL,
ALTER COLUMN "external_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "integrations_external_id_type_key" ON "integrations"("external_id", "type");
