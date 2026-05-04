-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "focusArea" TEXT NOT NULL,
    "practiceMode" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "hireSignal" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "speakerPreference" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeSession_clerkUserId_idx" ON "PracticeSession"("clerkUserId");

-- CreateIndex
CREATE INDEX "PracticeSession_createdAt_idx" ON "PracticeSession"("createdAt");
