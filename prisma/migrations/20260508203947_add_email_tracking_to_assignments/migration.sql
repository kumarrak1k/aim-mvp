-- AlterTable
ALTER TABLE "CandidateAssignment" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailMessageId" TEXT,
ADD COLUMN     "emailSendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailSentAt" TIMESTAMP(3);
