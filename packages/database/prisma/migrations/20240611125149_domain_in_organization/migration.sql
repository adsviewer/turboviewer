/*
  Warnings:

  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `user_roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[domain]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "RoleEnum" ADD VALUE 'ORG_ADMIN';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "domain" TEXT;

-- AlterTable
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");


COMMIT;
/*
 Add the ORG_ADMIN role to all users that don't have it yet. Since now we are creating the notion of multiple user
 per organization it is assume that all users have different organizations, so they should be ORG_ADMIN of their own organization.
 */
INSERT INTO user_roles (user_id, role, created_at, updated_at)
SELECT
    u.id AS user_id,
    'ORG_ADMIN' AS role,
    NOW() AS created_at,
    NOW() AS updated_at
FROM
    users u
        LEFT JOIN
    user_roles ur ON u.id = ur.user_id AND ur.role = 'ORG_ADMIN';
