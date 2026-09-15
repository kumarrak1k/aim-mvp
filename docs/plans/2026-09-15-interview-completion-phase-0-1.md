# Interview completion: Phase 0 (measure) + Phase 1 (stop losing people)

Agreed with Rakesh on 15 Sep 2026. Of 7 genuine new signups since 24 Aug, 3 finished onboarding, all 3 started a practice interview, and none finished it (they left after roughly 2, 6 and 9 minutes). An engaged long-standing user started 16 interviews and finished 1.

Causes:
- A session is saved only when every question is answered.
- There is no finish-early, resume or partial save, and the only exit discards everything.
- Nothing is tracked between `practice_started` and `practice_completed`.

Key insight: people leave while they are reading feedback, so progress is saved when feedback arrives, not when they click Next.

## Decisions and defaults
- **Headline admin numbers** exclude:
  - the team: superadmin, or an email matching `aicareermentor|kumarrak1k|rak1k`
  - anyone ever given complimentary access (`privateMetadata.compPlan` set)
  - orphan DB rows whose `clerkUserId` isn't in Clerk
- **Hire signal and readiness** are hidden when fewer than 3 questions are answered.
- **Unfinished interviews** become `abandoned` after 7 days.
- **Resume** works in typed, voice and voice+camera modes, with a tap card first because iOS won't start audio without a tap.
- **Onboarding step 1** is name and target role only. Career stage and sector move to step 2 as optional. Sector stays because the question bank will use it.
- **Cap rule:** a session counts once `answeredCount >= 1`. Kept simple, because Free and Plus are being removed next.
- **Databases:** .co.uk and .com use separate Neon databases, so the schema change is applied to each.
- **Company assessments and assessment centres** get no progress saves, finish-early or resume. A company assignment completes only on a full `completed` session.
- **Mode labels for the later Phase 2:** "Traditional interview" and "One-way video interview".

## Applying schema changes (how this repo does it)
- The build does not run migrations (`prisma generate && next build`).
- `_prisma_migrations` on .co.uk holds 10 migrations, up to 2026-08-02. Every schema change since then has been applied with `prisma db push` per database.
- Steps:
  1. Apply the additive schema to .co.uk prod (`ep-lively-frost`), .com prod (`ep-sparkling-unit`) and the test branch (`ep-spring-thunder`).
  2. Run the backfill SQL.
  3. Run `npm run db:drift`, which must pass before deploying code that reads the new columns.

## Phase 0: measure

### Commit 1: attemptId + practice_answered
- **Generate the ID.** Create `attemptId` with `crypto.randomUUID` in `startInterview` (`app/practice/session/page.tsx` ~1313). Store it in the sessionStorage config (`app/practice/session/utils.ts`: `PRACTICE_SESSION_CONFIG_KEY` ~121, `PracticeSessionConfig` ~128).
- **Pass it through.** Send it to `/api/interview`, `/api/feedback`, `/api/summary` and `POST /api/practice-sessions`. The client helpers live in `app/practice/lib/interviewApi.ts`.
- **New event.** Add `ACTIVITY_EVENTS.PRACTICE_ANSWERED = "practice_answered"` to `app/lib/activity.ts`.
  - Record it in `/api/feedback`, on success only (`app/api/feedback/route.ts` ~488).
  - Detail: `{attemptId, questionNumber, totalQuestions, practiceMode, isAssessment}`.
  - Bound the inputs: attemptId up to 64 characters, questionNumber 1 to 20. The body is read with bare `req.json()` (~114).
- **No "feedback viewed" event.** A successful score means feedback was delivered.
- **Exit point is derived.** For an attemptId without `practice_completed`, it is the highest `questionNumber` answered.
  - Do not use `/api/interview` calls for question n+1 as a signal. The prefetch (~page.tsx 1399) fires them as soon as feedback lands.
- **Existing events.**
  - Add `attemptId` to `practice_started` (`app/api/interview/route.ts` ~216-235).
  - Add `attemptId`, `answeredCount` and `finishedEarly` to `practice_completed` (`app/api/practice-sessions/route.ts` ~274).

### Commit 2: clean headline numbers
- **New helper** `app/lib/adminCohort.ts`: `isInternal(user)`, `isComplimentary(meta)`, `includedIds`.
- **`app/admin/page.tsx`:**
  - Compute headline counts from the per-user maps filtered to `includedIds`.
  - Drop the global counts (~161-166), which include team and orphan rows.
  - Paginate Clerk `getUserList`. It's capped at 500 today (~65), so any user past 500 would be flagged as an orphan.
- **Table:** keep every user, with Team and Comp badges and a filter toggle.

### Commit 3: started / answered / finished in admin
- **Data** (`page.tsx` ~118):
  - One `$queryRaw` counting DISTINCT `detail->>'attemptId'` per user and event, for `practice_started` and `practice_answered`.
  - Fall back to `COUNT(*)` for rows without an attemptId.
  - Run it for all time, 7 days and 30 days. "Finished" comes from the existing practice map.
- **`AdminClient.tsx`:**
  - `AdminUser` gains `practiceStarted` and `practiceAnswered` (~34).
  - `AdminOverview` gains `interviews{started,answered,finished}{7d,30d,total}` (~65).
  - Table badge "3▶ 1✎ 0✓" (~889).
  - Replace the Sessions card (~742).
  - The funnel (~759) becomes Signed up → Profile → Started → Answered 1+ → Finished → Paying.
- **Per-user report:** `userActivityReport.ts` (~151) adds `practiceAnsweredAttempts` and `lastExitQuestion`, rendered in `UserActivityPanel.tsx` (~194).

## Phase 1: stop losing people

### Commit 4: additive schema + status filters (no behaviour change)
```prisma
model PracticeSession {
  overallScore   Int       @default(0)
  hireSignal     String    @default("")
  summary        Json      @default("{}")
  status         String    @default("completed") // in_progress | completed | finished_early | abandoned
  answeredCount  Int       @default(0)
  attemptId      String?
  config         Json?     // PracticeSessionConfig minus assessment fields, for resume
  completedAt    DateTime?
  lastActivityAt DateTime  @default(now())
  @@unique([clerkUserId, attemptId])
  @@index([clerkUserId, status, updatedAt])
}
```
- **Backfill:** `answeredCount = jsonb_array_length(results)` and `completedAt = createdAt`. Postgres allows multiple NULL `attemptId` values under the unique index.
- **New constants file** `app/lib/practiceSessionStatus.ts`: `LISTED_STATUSES`, the `COUNTED` rule, `isStale` (7 days).
- **Readers that must filter by status:**
  - `api/practice-sessions`: list (~121, add `inProgress`) and usage counts (~43, 73, 84)
  - `[sessionId]` route (~34): return status
  - `admin/page.tsx` (~133)
  - `userActivityReport.ts` (~114)
  - `cron/daily-stats` (~143-144)
  - `referralRewards.ts` (~52): completed and finished_early only
  - `assessment/[token]` route (~143): require completed
- **Any status is fine for:** interview de-duplication (~264), `cron/nurture` (~60), account-data, account/delete.
- **Unaffected:** company/results, v1/candidates.

### Commit 5: progress saves
- **New `PUT /api/practice-sessions/progress`**
  - Body: `{attemptId, role, experienceLevel, interviewType, difficulty, focusArea, practiceMode, totalQuestions, speakerPreference, config, results}`.
  - Upserts on (user, attemptId) and sets `answeredCount` and `lastActivityAt`.
  - Returns 409 if the row is no longer in_progress or the results would shrink.
  - Returns 400 on an assessment config.
  - Cap check on create.
- **`POST /api/practice-sessions`**
  - Accepts `attemptId?` and `finishedEarly?`. Updates a matching in_progress row, otherwise creates one, so old clients and the assessment centre keep working.
  - `finishedEarly` plus `assignmentToken` returns 400.
  - The assignment (~259) completes only when status is completed and `results.length >= totalQuestions`.
- **Client** (`page.tsx`):
  - In `getFeedback`, after `setFeedback` (~1697), build the result item from the scored `safeAnswer` and PUT `[...results, item]`.
  - PUT again when the model answer merges (~1657).
  - `nextStep` (~1811) PUTs the final answer text.
  - Extract ~1834-1873 into `finishInterview(results, {early})`. `saveSession` (~729) sends `attemptId` and `finishedEarly`.

### Commit 6: finish early + exit dialog + partial summary
- **`FeedbackWorkspace.tsx`:** a secondary "Finish and see my results" button when the current question isn't the last. Hidden in assessment mode or when an assessment centre is set.
- **Exit controls.** `QuestionHero` "Back" (~146) and `SessionHeader` "Exit" (~155) currently discard everything via `resetInterview` or a link.
  - Replace both with a dialog: Save and exit / Finish and see my results (only if 1+ answered) / Discard.
  - Thread an `onExitRequest` prop through `PracticeSessionShell` (~page.tsx 2150).
  - The header link is `hidden sm:block`, so on mobile only `QuestionHero` has an exit.
- **`/api/summary`** already allows partial results; it rejects only zero (~430-437).
  - Add `answeredCount` and `totalQuestions` to the body, plus a prompt line not to penalise unanswered questions (~633).
  - With 1 answer, hide the weakest-question section.
- **`SessionSummary`:**
  - Add a "2 of 5 answered / finished early" banner.
  - The hardcoded "of 3 free sessions" text (~685-688) should read from `FREE_TIER`.
- Disable finish-early while `isListening`, `feedbackLoading` or `whisperEnhancing` is true, and abort the prefetch on finish.

### Commit 7: resume + abandon + stale sweep
- **Reload.** If the config has an attemptId, fetch that row before booting; the boot effect (~1385) currently restarts at question 1.
  1. Show a "Resume interview" tap card.
  2. Then `setResults(row.results)`, `setInterviewStarted(true)`, `fetchQuestion(answeredCount+1, results)`.
  3. Restore `speakerEnabled` and `cameraEnabled` from the config, because `practiceMode` is derived from them (~246).
- **Return visit.** `GET /api/practice-sessions` returns `inProgress`.
  - `PracticePageClient` (~382) shows "Continue your interview (2 of 5)". That writes `row.config` plus `attemptId` into sessionStorage and routes to the session.
  - "Start fresh" calls `POST /api/practice-sessions/[id]/abandon`.
- **Stale rows:** read-time `isStale` at 7 days; the daily-stats cron sets them to abandoned.
- **Optional:** debounce the typed draft into `sessionStorage["aim_draft_<attemptId>"]`.

### Commit 8: cap rule
- In `getUsageInfo` (~route.ts 43, 73, 84), count sessions with `answeredCount >= 1`, whatever the status, using the rule defined once in `practiceSessionStatus.ts`.
- Resume reuses the same row, so nothing is counted twice.

### Commit 9: onboarding step 1
- **`OnboardingClient.tsx`** (~101-106, 180-261): step 1 becomes first name and target role. Career stage (4 cards) and sector (9 cards) move to step 2 as optional chips.
- **`api/onboarding/route.ts`** (~28-29):
  - `careerStage` and `targetSector` become optional.
  - Set `defaultExperienceLevel` only when a stage is given.
  - Leave missing lines out of the `roleSpec` text (~94-96).
- **`onboarding.ts` `buildPlanIntro`** (~229): guard `sector.toLowerCase()` against an empty sector.

### Commit 10: mirror to aim-mvp-com
- Files: `app/[locale]/practice/session/*`, `app/[locale]/onboarding/OnboardingClient.tsx`, `app/[locale]/admin`, `api/{practice-sessions,interview,feedback,summary,onboarding}`, `lib/activity.ts`, `lib/userActivityReport.ts`.
- Apply the schema change to the .com database too.

## Edge cases
- **Multiple tabs.** "Duplicate tab" copies sessionStorage, so both tabs share an attemptId. The results-can-only-grow rule plus 409 prevents shrinking; show "continued in another tab".
- **Voice and voice+camera.** Resume needs a tap before audio on iOS. The camera restarts through `requiresManualCameraStart`.
- **Whisper.**
  - The feedback button is already disabled while Whisper runs (~page.tsx 1110), so the first save uses the post-Whisper text.
  - The `nextStep` re-save wins if the text changes afterwards.
  - Leaving mid-Whisper loses only that one unscored answer.

## Tests
- **Unit** (vitest; mock prisma as in `assessmentCentreGate.test.ts`):
  - New tests: `practiceSessionStatus`, `adminCohort`, `practiceProgressRoute` (upsert, 409s, assessment rejection, cap on create), POST finished-early transitions, and the feedback route recording `practice_answered`.
  - Extend `sessionHelpers` (one-result fallback), `summaryCoherence` (partial results) and `onboarding` (empty sector and stage).
- **E2E pack** (`tests/e2e/pack/specs`):
  - `candidate-typed` and `fixtures/candidateBot.ts`: the new button text must not match the bot's regex.
  - New specs: finish-early, reload-resume, exit dialog.
  - `voice-interview`: resume tap card.
  - `onboarding.spec`: step 2 fields.
  - `corporate-admin`: no finish-early in assessment mode.
  - `personas` and `zz-account`: data export now includes status.
- **Before each deploy:** tsc, unit tests, the e2e pack, and a simulated-user QA sweep.

## Next workstream after Phases 0 and 1: pricing switch
- **Plans:** remove Free and Plus. A single Pro plan at £15/month, £38/quarter and £120/year. Keep the 3-day no-card trial.
- **Stripe:** new product and prices were created ahead of time; archive the old Plus and Professional prices only when the code switch ships.
- **Promo codes:** re-attach SUMMER2026 and STUDENT50.
- **Copy:** free-tier wording appears in 46 files (.co.uk) and 34 (.com).
