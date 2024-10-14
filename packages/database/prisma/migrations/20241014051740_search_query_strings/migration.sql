-- CreateTable
CREATE TABLE "search_query_strings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "queryString" TEXT NOT NULL,
    "is_organization" BOOLEAN NOT NULL,
    "parent_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_strings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_query_strings_parent_id_idx" ON "search_query_strings"("parent_id");
