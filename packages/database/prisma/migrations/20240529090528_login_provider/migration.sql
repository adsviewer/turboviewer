/*
  Warnings:

  - You are about to drop the column `google_id` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LoginProviderEnum" AS ENUM ('GOOGLE');

-- DropIndex
DROP INDEX "users_google_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "google_id";

-- CreateTable
CREATE TABLE "login_provider_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "LoginProviderEnum" NOT NULL,

    CONSTRAINT "login_provider_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_provider_users_id_provider_key" ON "login_provider_users"("id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "login_provider_users_user_id_provider_key" ON "login_provider_users"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "login_provider_users" ADD CONSTRAINT "login_provider_users_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
