/*
  Warnings:

  - You are about to drop the column `user_id` on the `notifications` table. All the data in the column will be lost.
  - Added the required column `receiving_user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropIndex
DROP INDEX "notifications_user_id_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "user_id",
ADD COLUMN     "receiving_user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_receiving_user_id_idx" ON "notifications"("receiving_user_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiving_user_id_fkey" FOREIGN KEY ("receiving_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
