-- DropIndex
DROP INDEX "notifications_receiving_user_id_idx";

-- CreateIndex
CREATE INDEX "notifications_receiving_user_id_is_read_idx" ON "notifications"("receiving_user_id", "is_read");
