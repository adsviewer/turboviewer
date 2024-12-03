/*
  Warnings:

  - You are about to drop the `_AdAccountToIntegration` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateTable
CREATE TABLE "ad_account_integrations" (
    "ad_account_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "AdAccountIntegration_pkey" PRIMARY KEY ("ad_account_id","integration_id")
);

-- AddForeignKey
ALTER TABLE "ad_account_integrations" ADD CONSTRAINT "AdAccountIntegration_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_account_integrations" ADD CONSTRAINT "AdAccountIntegration_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "ad_account_integrations" ("ad_account_id", "integration_id", "enabled")
SELECT "A", "B", TRUE FROM "_AdAccountToIntegration";

-- DropForeignKey
ALTER TABLE "_AdAccountToIntegration" DROP CONSTRAINT "_AdAccountToIntegration_A_fkey";

-- DropForeignKey
ALTER TABLE "_AdAccountToIntegration" DROP CONSTRAINT "_AdAccountToIntegration_B_fkey";

-- DropTable
DROP TABLE "_AdAccountToIntegration";
