-- DropIndex
DROP INDEX "insights_ad_account_id_idx";

-- CreateIndex
CREATE INDEX "insights_ad_account_id_date_idx" ON "insights"("ad_account_id", "date");
