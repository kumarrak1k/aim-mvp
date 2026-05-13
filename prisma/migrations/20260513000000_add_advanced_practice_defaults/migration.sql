-- AlterTable
ALTER TABLE "UserProfile"
  ADD COLUMN "defaultTotalQuestions" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "defaultUseHybridMix" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "defaultQuestionMix" JSONB;
