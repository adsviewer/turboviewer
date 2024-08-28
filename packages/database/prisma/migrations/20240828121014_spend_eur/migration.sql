-- DropIndex
DROP INDEX "insights_spend_idx";

-- AlterTable
ALTER TABLE "insights" ADD COLUMN     "currency_convertion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spend_eur" INTEGER;

-- CreateIndex
CREATE INDEX "insights_spend_eur_idx" ON "insights"("spend_eur");

UPDATE "insights" SET "spend_eur" = spend;
