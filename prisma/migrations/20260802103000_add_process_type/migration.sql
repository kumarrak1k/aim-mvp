-- What kind of process the candidate is facing: a competency interview, a full
-- assessment centre, or not yet known. Asked because this product runs
-- assessment centres, and it decides where onboarding hands them off.
ALTER TABLE "UserProfile" ADD COLUMN "processType" TEXT;
