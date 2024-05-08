/*
  Warnings:

  - You are about to drop the column `role_id` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `role` to the `user_roles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- AlterTable
ALTER TABLE "user_roles" DROP COLUMN "role_id",
ADD COLUMN     "role" "RoleEnum" NOT NULL;

-- DropTable
DROP TABLE "roles";
