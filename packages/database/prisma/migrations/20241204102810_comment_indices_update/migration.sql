-- DropIndex
DROP INDEX "comments_creative_id_user_id_created_at_idx";

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_creative_id_created_at_idx" ON "comments"("creative_id", "created_at");
