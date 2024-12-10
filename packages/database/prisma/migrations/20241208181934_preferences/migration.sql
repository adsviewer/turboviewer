-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "insights_per_row" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add default preferences to all existing users
INSERT INTO "preferences" ("id", "insights_per_row") SELECT "id", 3 FROM "users";
