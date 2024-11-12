-- CreateTable
CREATE TABLE "AdAccountIntegration" (
    "id" SERIAL NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdAccountIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdAccountIntegration_adAccountId_integrationId_key" ON "AdAccountIntegration"("adAccountId", "integrationId");

-- AddForeignKey
ALTER TABLE "AdAccountIntegration" ADD CONSTRAINT "AdAccountIntegration_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "ad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdAccountIntegration" ADD CONSTRAINT "AdAccountIntegration_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
