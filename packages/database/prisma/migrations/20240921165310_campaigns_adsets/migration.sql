/*
  Warnings:

  - A unique constraint covering the columns `[ad_set_id,external_id]` on the table `ads` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ads" ADD COLUMN     "ad_set_id" TEXT;

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "ad_account_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_sets" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_name_idx" ON "campaigns"("name");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_ad_account_id_external_id_key" ON "campaigns"("ad_account_id", "external_id");

-- CreateIndex
CREATE INDEX "ad_sets_name_idx" ON "ad_sets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ad_sets_campaign_id_external_id_key" ON "ad_sets"("campaign_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "ads_ad_set_id_external_id_key" ON "ads"("ad_set_id", "external_id");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_ad_account_id_fkey" FOREIGN KEY ("ad_account_id") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_ad_set_id_fkey" FOREIGN KEY ("ad_set_id") REFERENCES "ad_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
