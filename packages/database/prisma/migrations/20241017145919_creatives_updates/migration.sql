/*
  Warnings:

  - A unique constraint covering the columns `[external_id,ad_account_id]` on the table `creatives` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `body` to the `creatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `call_to_action_type` to the `creatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `external_id` to the `creatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image_url` to the `creatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `creatives` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `creatives` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "creatives_ad_account_id_name_key";

-- AlterTable
ALTER TABLE "creatives" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "call_to_action_type" TEXT NOT NULL,
ADD COLUMN     "external_id" TEXT NOT NULL,
ADD COLUMN     "image_url" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "creatives_external_id_ad_account_id_key" ON "creatives"("external_id", "ad_account_id");
