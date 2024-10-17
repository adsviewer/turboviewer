/*
  Warnings:

  - A unique constraint covering the columns `[parent_id,name]` on the table `search_query_strings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "search_query_strings_parent_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "search_query_strings_parent_id_name_key" ON "search_query_strings"("parent_id", "name");
