-- Candidate onboarding. Asked once, immediately after terms acceptance.
--
-- Every UserProfile row was empty before this: no CV text, no role, no goals.
-- The conclusion drawn from that was low engagement; the actual cause was that
-- nothing ever asked. Nullable throughout so existing rows stay valid and the
-- flow can be resumed rather than forced.
ALTER TABLE "UserProfile"
  ADD COLUMN "targetRole" TEXT,
  ADD COLUMN "targetSector" TEXT,
  ADD COLUMN "biggestChallenge" TEXT,
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
  ADD COLUMN "onboardingSkipped" BOOLEAN NOT NULL DEFAULT false;
