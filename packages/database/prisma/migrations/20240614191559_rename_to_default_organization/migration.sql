-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_last_logged_in_organization_id_fkey";

-- DropIndex
DROP INDEX "users_last_logged_in_organization_id_idx";

-- AlterTable
ALTER TABLE "users" RENAME COLUMN "last_logged_in_organization_id" TO "default_organization_id";

-- CreateIndex
CREATE INDEX "users_default_organization_id_idx" ON "users"("default_organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_organization_id_fkey" FOREIGN KEY ("default_organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
