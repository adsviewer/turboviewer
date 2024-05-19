/*
  Warnings:

  - You are about to drop the `forget_passwords` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "forget_passwords" DROP CONSTRAINT "forget_passwords_id_fkey";

-- DropTable
DROP TABLE "forget_passwords";
