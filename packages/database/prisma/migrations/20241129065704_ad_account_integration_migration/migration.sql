CREATE TABLE "AdAccountIntegration" (
    "id" SERIAL NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT null,
    
    CONSTRAINT "AdAccountIntegration_pkey" PRIMARY KEY ("adAccountId", "integrationId")
);


INSERT INTO "AdAccountIntegration" ("adAccountId", "integrationId", "enabled")
SELECT "A", "B", TRUE FROM "_AdAccountToIntegration";

-- DROP TABLE "_AdAccountToIntegration";