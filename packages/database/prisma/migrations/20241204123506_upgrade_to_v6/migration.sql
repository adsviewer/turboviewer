-- AlterTable
ALTER TABLE "_AdAccountToOrganization" ADD CONSTRAINT "_AdAccountToOrganization_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AdAccountToOrganization_AB_unique";

-- AlterTable
ALTER TABLE "_COMMENT_TAGGED_USERS" ADD CONSTRAINT "_COMMENT_TAGGED_USERS_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_COMMENT_TAGGED_USERS_AB_unique";

-- AlterTable
ALTER TABLE "ad_account_integrations" RENAME CONSTRAINT "AdAccountIntegration_pkey" TO "ad_account_integrations_pkey";

-- RenameForeignKey
ALTER TABLE "ad_account_integrations" RENAME CONSTRAINT "AdAccountIntegration_ad_account_id_fkey" TO "ad_account_integrations_ad_account_id_fkey";

-- RenameForeignKey
ALTER TABLE "ad_account_integrations" RENAME CONSTRAINT "AdAccountIntegration_integration_id_fkey" TO "ad_account_integrations_integration_id_fkey";
