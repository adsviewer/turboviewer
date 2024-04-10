/*
  Warnings:

  - You are about to drop the column `expires_at` on the `integrations` table. All the data in the column will be lost.
  - Added the required column `access_token_expires_at` to the `integrations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "integrations" DROP COLUMN "expires_at",
ADD COLUMN     "access_token_expires_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "external_id" DROP NOT NULL;
