-- DropIndex
DROP INDEX "comments_creative_id_idx";

-- DropIndex
DROP INDEX "comments_user_id_idx";

-- AlterTable
ALTER TABLE "_AdAccountToIntegration" ADD CONSTRAINT "_AdAccountToIntegration_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AdAccountToIntegration_AB_unique";

-- AlterTable
ALTER TABLE "_AdAccountToOrganization" ADD CONSTRAINT "_AdAccountToOrganization_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AdAccountToOrganization_AB_unique";

-- AlterTable
ALTER TABLE "_COMMENT_TAGGED_USERS" ADD CONSTRAINT "_COMMENT_TAGGED_USERS_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_COMMENT_TAGGED_USERS_AB_unique";

-- CreateIndex
CREATE INDEX "comments_creative_id_user_id_created_at_idx" ON "comments"("creative_id", "user_id", "created_at");
