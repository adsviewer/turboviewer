-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_creative_id_fkey";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "ad_id" TEXT,
ALTER COLUMN "creative_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "creatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
