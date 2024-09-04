-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('Launch', 'Build', 'Grow', 'Scale');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'Launch';
