-- CreateEnum
CREATE TYPE "MilestoneEnum" AS ENUM ('Onboarding');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "milestones" "MilestoneEnum"[] DEFAULT ARRAY['Onboarding']::"MilestoneEnum"[];

-- Empty the milestones array for all users
UPDATE users
SET milestones = '{}';

-- Add Onboarding Milestone to users whose organization does not have any integrations
UPDATE users
SET milestones = array_append(milestones, 'Onboarding')
WHERE current_organization_id IN (
    SELECT id
    FROM organizations
    WHERE NOT EXISTS (
        SELECT 1
        FROM integrations
        WHERE integrations.organization_id = organizations.id
    )
);
