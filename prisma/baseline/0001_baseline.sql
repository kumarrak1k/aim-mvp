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

-- CreateTable
CREATE TABLE "CareerDocGeneration" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerDocGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailPreference" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribeToken" TEXT NOT NULL,
    "consentSource" TEXT NOT NULL DEFAULT 'signup',
    "consentUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialGrant" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppressedEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuppressedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedStripeEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#8c5cff',
    "planId" TEXT,
    "planStatus" TEXT NOT NULL DEFAULT 'none',
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "trialInvitesUsed" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'recruiter',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInvite" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'recruiter',
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL DEFAULT 'Graduate / entry level',
    "templateType" TEXT NOT NULL DEFAULT 'interview',
    "acStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questionMix" JSONB,
    "interviewType" TEXT NOT NULL DEFAULT 'Competency / behavioural',
    "difficulty" TEXT NOT NULL DEFAULT 'Standard',
    "focusArea" TEXT NOT NULL DEFAULT 'Balanced',
    "questionCount" INTEGER NOT NULL DEFAULT 5,
    "customInstructions" TEXT,
    "competencyFramework" TEXT,
    "customQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateAssignment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "clerkUserId" TEXT,
    "sessionId" TEXT,
    "acSessionId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "emailMessageId" TEXT,
    "emailError" TEXT,
    "emailSendCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "messageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralUse" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "newUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCentreSession" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "assignmentToken" TEXT,
    "templateConfig" JSONB,
    "role" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "selectedStages" TEXT[] DEFAULT ARRAY['stage1', 'stage2', 'stage3']::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'setup',
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "caseStudyScenario" JSONB,
    "caseStudyResponse" TEXT,
    "caseStudyFeedback" JSONB,
    "caseStudyScore" DOUBLE PRECISION,
    "caseStudyTimeMs" INTEGER,
    "interviewResults" JSONB,
    "interviewSummary" JSONB,
    "interviewScore" DOUBLE PRECISION,
    "presentationBrief" JSONB,
    "presentationResponse" TEXT,
    "presentationFeedback" JSONB,
    "presentationScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "report" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCentreSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "cvText" TEXT NOT NULL DEFAULT '',
    "roleSpec" TEXT NOT NULL DEFAULT '',
    "interviewGoals" TEXT NOT NULL DEFAULT '',
    "cvFileName" TEXT NOT NULL DEFAULT '',
    "roleSpecFileName" TEXT NOT NULL DEFAULT '',
    "preferredPracticeMode" TEXT NOT NULL DEFAULT 'typed',
    "speakerPreference" JSONB NOT NULL DEFAULT '{"voice":"female","accent":"british","pace":"natural"}',
    "defaultExperienceLevel" TEXT NOT NULL DEFAULT 'Graduate / entry level',
    "defaultInterviewType" TEXT NOT NULL DEFAULT 'Competency / behavioural',
    "defaultDifficulty" TEXT NOT NULL DEFAULT 'Standard',
    "defaultFocusArea" TEXT NOT NULL DEFAULT 'Balanced',
    "defaultTotalQuestions" INTEGER NOT NULL DEFAULT 5,
    "defaultUseHybridMix" BOOLEAN NOT NULL DEFAULT false,
    "defaultQuestionMix" JSONB,
    "tosAcceptedAt" TIMESTAMP(3),
    "tosAcceptedVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "PracticeSession_clerkUserId_idx" ON "PracticeSession"("clerkUserId");

-- CreateIndex
CREATE INDEX "PracticeSession_createdAt_idx" ON "PracticeSession"("createdAt");

-- CreateIndex
CREATE INDEX "PracticeSession_clerkUserId_createdAt_idx" ON "PracticeSession"("clerkUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CareerDocGeneration_clerkUserId_createdAt_idx" ON "CareerDocGeneration"("clerkUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreference_clerkUserId_key" ON "EmailPreference"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreference_unsubscribeToken_key" ON "EmailPreference"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "EmailPreference_clerkUserId_idx" ON "EmailPreference"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TrialGrant_emailHash_key" ON "TrialGrant"("emailHash");

-- CreateIndex
CREATE INDEX "TrialGrant_clerkUserId_idx" ON "TrialGrant"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SuppressedEmail_email_key" ON "SuppressedEmail"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_slug_idx" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_companyId_idx" ON "ApiKey"("companyId");

-- CreateIndex
CREATE INDEX "CompanyMember_clerkUserId_idx" ON "CompanyMember"("clerkUserId");

-- CreateIndex
CREATE INDEX "CompanyMember_companyId_idx" ON "CompanyMember"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyMember_companyId_clerkUserId_key" ON "CompanyMember"("companyId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvite_token_key" ON "CompanyInvite"("token");

-- CreateIndex
CREATE INDEX "CompanyInvite_token_idx" ON "CompanyInvite"("token");

-- CreateIndex
CREATE INDEX "CompanyInvite_companyId_idx" ON "CompanyInvite"("companyId");

-- CreateIndex
CREATE INDEX "AssessmentTemplate_companyId_idx" ON "AssessmentTemplate"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateAssignment_inviteToken_key" ON "CandidateAssignment"("inviteToken");

-- CreateIndex
CREATE INDEX "CandidateAssignment_companyId_idx" ON "CandidateAssignment"("companyId");

-- CreateIndex
CREATE INDEX "CandidateAssignment_inviteToken_idx" ON "CandidateAssignment"("inviteToken");

-- CreateIndex
CREATE INDEX "CandidateAssignment_clerkUserId_idx" ON "CandidateAssignment"("clerkUserId");

-- CreateIndex
CREATE INDEX "EmailJob_status_scheduledAt_idx" ON "EmailJob"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "EmailJob_userId_idx" ON "EmailJob"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_userId_key" ON "Referral"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralUse_referralId_newUserId_key" ON "ReferralUse"("referralId", "newUserId");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCentreSession_assignmentToken_key" ON "AssessmentCentreSession"("assignmentToken");

-- CreateIndex
CREATE INDEX "AssessmentCentreSession_clerkUserId_idx" ON "AssessmentCentreSession"("clerkUserId");

-- CreateIndex
CREATE INDEX "AssessmentCentreSession_status_idx" ON "AssessmentCentreSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_clerkUserId_key" ON "UserProfile"("clerkUserId");

-- CreateIndex
CREATE INDEX "UserProfile_clerkUserId_idx" ON "UserProfile"("clerkUserId");

-- CreateIndex
CREATE INDEX "TermsAcceptance_clerkUserId_idx" ON "TermsAcceptance"("clerkUserId");

-- CreateIndex
CREATE INDEX "TermsAcceptance_version_idx" ON "TermsAcceptance"("version");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInvite" ADD CONSTRAINT "CompanyInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentTemplate" ADD CONSTRAINT "AssessmentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAssignment" ADD CONSTRAINT "CandidateAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAssignment" ADD CONSTRAINT "CandidateAssignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUse" ADD CONSTRAINT "ReferralUse_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

