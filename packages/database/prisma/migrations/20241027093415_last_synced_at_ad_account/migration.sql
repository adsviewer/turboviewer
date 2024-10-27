-- AlterTable
ALTER TABLE "ad_accounts" ADD COLUMN     "last_synced_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "tier_changed_at" TIMESTAMP(3);
