-- AlterTable
ALTER TABLE "UserProfile"
  ADD COLUMN "tosAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "tosAcceptedVersion" TEXT;

-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TermsAcceptance_clerkUserId_idx" ON "TermsAcceptance"("clerkUserId");

-- CreateIndex
CREATE INDEX "TermsAcceptance_version_idx" ON "TermsAcceptance"("version");
