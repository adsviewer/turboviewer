/*
  Warnings:

  - The primary key for the `AdAccountIntegration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `AdAccountIntegration` table. All the data in the column will be lost.
  - You are about to drop the column `selected` on the `AdAccountIntegration` table. All the data in the column will be lost.
  - You are about to drop the `_AdAccountToIntegration` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `enabled` to the `AdAccountIntegration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_AdAccountToIntegration" DROP CONSTRAINT "_AdAccountToIntegration_A_fkey";

-- DropForeignKey
ALTER TABLE "_AdAccountToIntegration" DROP CONSTRAINT "_AdAccountToIntegration_B_fkey";

-- DropIndex
DROP INDEX "AdAccountIntegration_adAccountId_integrationId_key";

-- AlterTable
ALTER TABLE "AdAccountIntegration" DROP CONSTRAINT "AdAccountIntegration_pkey",
DROP COLUMN "id",
DROP COLUMN "selected",
ADD COLUMN     "enabled" BOOLEAN NOT NULL,
ADD CONSTRAINT "AdAccountIntegration_pkey" PRIMARY KEY ("adAccountId", "integrationId");

-- DropTable
DROP TABLE "_AdAccountToIntegration";
