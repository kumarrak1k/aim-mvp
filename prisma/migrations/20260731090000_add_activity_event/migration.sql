-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "plan" TEXT,
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEvent_clerkUserId_createdAt_idx" ON "ActivityEvent"("clerkUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_event_createdAt_idx" ON "ActivityEvent"("event", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");
