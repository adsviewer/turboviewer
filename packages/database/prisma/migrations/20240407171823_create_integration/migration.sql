-- CreateEnum
CREATE TYPE "IntegrationTypeEnum" AS ENUM ('FACEBOOK', 'TIKTOK', 'LINKEDIN');

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "IntegrationTypeEnum" NOT NULL,
    "external_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integrations_organization_id_type_key" ON "integrations"("organization_id", "type");

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
