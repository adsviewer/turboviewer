/*
  Warnings:

  - You are about to drop the column `integration_id` on the `ad_accounts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ad_accounts" DROP CONSTRAINT "ad_accounts_integration_id_fkey";

-- CreateTable
CREATE TABLE "_AdAccountToIntegration" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AdAccountToIntegration_AB_unique" ON "_AdAccountToIntegration"("A", "B");

-- CreateIndex
CREATE INDEX "_AdAccountToIntegration_B_index" ON "_AdAccountToIntegration"("B");

-- AddForeignKey
ALTER TABLE "_AdAccountToIntegration" ADD CONSTRAINT "_AdAccountToIntegration_A_fkey" FOREIGN KEY ("A") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdAccountToIntegration" ADD CONSTRAINT "_AdAccountToIntegration_B_fkey" FOREIGN KEY ("B") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Populate _AdAccountToIntegration with existing integration_id values
INSERT INTO "_AdAccountToIntegration" ("A", "B")
SELECT "id", "integration_id"
FROM "ad_accounts";

-- AlterTable
ALTER TABLE "ad_accounts" DROP COLUMN "integration_id";
