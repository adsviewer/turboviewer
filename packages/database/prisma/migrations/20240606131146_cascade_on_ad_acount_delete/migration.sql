-- DropForeignKey
ALTER TABLE "ads" DROP CONSTRAINT "ads_ad_account_id_fkey";

-- DropForeignKey
ALTER TABLE "creatives" DROP CONSTRAINT "creatives_ad_account_id_fkey";

-- DropForeignKey
ALTER TABLE "insights" DROP CONSTRAINT "insights_ad_account_id_fkey";

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
