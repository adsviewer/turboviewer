/*
  Warnings:

  - A unique constraint covering the columns `[external_id,type]` on the table `ad_accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ad_accounts" ADD COLUMN     "type" "IntegrationTypeEnum" NOT NULL DEFAULT 'META';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "parent_id" TEXT;

-- CreateTable
CREATE TABLE "_AdAccountToOrganization" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AdAccountToOrganization_AB_unique" ON "_AdAccountToOrganization"("A", "B");

-- CreateIndex
CREATE INDEX "_AdAccountToOrganization_B_index" ON "_AdAccountToOrganization"("B");

-- CreateIndex
CREATE UNIQUE INDEX "ad_accounts_external_id_type_key" ON "ad_accounts"("external_id", "type");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdAccountToOrganization" ADD CONSTRAINT "_AdAccountToOrganization_A_fkey" FOREIGN KEY ("A") REFERENCES "ad_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdAccountToOrganization" ADD CONSTRAINT "_AdAccountToOrganization_B_fkey" FOREIGN KEY ("B") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
