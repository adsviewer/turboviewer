-- DropForeignKey
ALTER TABLE "login_provider_users" DROP CONSTRAINT "login_provider_users_id_fkey";

-- AddForeignKey
ALTER TABLE "login_provider_users" ADD CONSTRAINT "login_provider_users_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
