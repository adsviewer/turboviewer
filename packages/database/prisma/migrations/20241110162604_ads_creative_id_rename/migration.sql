-- DropForeignKey
ALTER TABLE "ads" DROP CONSTRAINT "ads_creativeId_fkey";

-- AlterTable
ALTER TABLE "ads" RENAME COLUMN "creativeId" TO "creative_id";

-- CreateIndex
CREATE INDEX "ads_creative_id_idx" ON "ads"("creative_id");

-- AddForeignKey
ALTER TABLE "ads" ADD CONSTRAINT "ads_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "creatives"("id") ON DELETE SET NULL ON UPDATE CASCADE;
