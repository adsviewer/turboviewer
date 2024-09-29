-- CreateEnum
CREATE TYPE "FeedbackTypeEnum" AS ENUM ('BUG_REPORT', 'FEATURE_SUGGESTION', 'OTHER');

-- Rename userId
ALTER TABLE "Feedback" RENAME COLUMN "userId" TO "user_id";
-- Rename Table
ALTER TABLE "Feedback" RENAME TO "feedbacks";
