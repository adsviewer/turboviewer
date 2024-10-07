-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "current_organization_id" TEXT;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_current_organization_id_fkey" FOREIGN KEY ("current_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
