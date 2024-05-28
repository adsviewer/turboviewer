/*
  Warnings:

  - Made the column `ad_account_id` on table `insights` required. This step will fail if there are existing NULL values in that column.
  - Made the column `currency` on table `insights` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "insights" DROP CONSTRAINT "insights_ad_account_id_fkey";

-- AlterTable
ALTER TABLE "ad_accounts" ALTER COLUMN "name" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ads" ALTER COLUMN "name" DROP DEFAULT;

-- AlterTable
ALTER TABLE "insights" ALTER COLUMN "ad_account_id" SET NOT NULL,
ALTER COLUMN "currency" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
