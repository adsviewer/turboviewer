/*
  Warnings:

  - Made the column `name` on table `ad_accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ad_accounts" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT 'No name';

-- AlterTable
ALTER TABLE "insights" ADD COLUMN     "ad_account_id" TEXT,
ADD COLUMN     "currency" "CurrencyEnum";

-- CreateIndex
CREATE INDEX "insights_ad_account_id_idx" ON "insights"("ad_account_id");

-- CreateIndex
CREATE INDEX "insights_currency_idx" ON "insights"("currency");

-- CreateIndex
CREATE INDEX "insights_date_idx" ON "insights"("date");

-- CreateIndex
CREATE INDEX "insights_impressions_idx" ON "insights"("impressions");

-- CreateIndex
CREATE INDEX "insights_spend_idx" ON "insights"("spend");

-- CreateIndex
CREATE INDEX "insights_device_idx" ON "insights"("device");

-- CreateIndex
CREATE INDEX "insights_publisher_idx" ON "insights"("publisher");

-- CreateIndex
CREATE INDEX "insights_position_idx" ON "insights"("position");

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
