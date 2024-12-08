-- CreateEnum
CREATE TYPE "NotificationTypeEnum" AS ENUM ('COMMENT_MENTION', 'NEW_INTEGRATION');

-- DropIndex
DROP INDEX "comments_creative_id_idx";

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationTypeEnum" NOT NULL,
    "receiving_user_id" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL,
    "extra_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_receiving_user_id_idx" ON "notifications"("receiving_user_id");

-- CreateIndex
CREATE INDEX "comments_creative_id_created_at_idx" ON "comments"("creative_id", "created_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiving_user_id_fkey" FOREIGN KEY ("receiving_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
