-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_default_organization_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "default_organization_id" DROP NOT NULL,
ALTER COLUMN "email_type" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_organization_id_fkey" FOREIGN KEY ("default_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
