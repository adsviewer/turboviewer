-- CreateEnum
CREATE TYPE "NotificationTypeEnum" AS ENUM ('COMMENT_MENTION', 'NEW_INTEGRATION');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationTypeEnum" NOT NULL,
    "receiving_user_ids" TEXT NOT NULL,
    "comment_mention_creative_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_receiving_user_ids_idx" ON "notifications"("receiving_user_ids");

-- CreateIndex
CREATE INDEX "notifications_comment_mention_creative_id_idx" ON "notifications"("comment_mention_creative_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiving_user_ids_fkey" FOREIGN KEY ("receiving_user_ids") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
