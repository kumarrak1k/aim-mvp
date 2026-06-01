# Automated test pack

Seeds candidate logins for every plan and drives a **simulated candidate through
a full typed interview** (plus per-persona plan gating), so you stop running
manual cases.

Everything lives under `tests/e2e/pack/` and runs via a **separate** Playwright
config (`playwright.tests.config.ts`). The production smoke suite
(`tests/e2e/smoke.spec.ts` via `playwright.config.ts`) is untouched and
`testIgnore`s this folder, so the pack can never run against production.

## What it covers
- ✅ Persona entitlement matrix (pure unit) — `tests/unit/candidatePlan.persona.test.ts`, runs in `npm test`.
- ✅ Persona logins: Free / Trial / Plus / Professional + a corporate admin, seeded via Clerk `privateMetadata` (no Stripe).
- ✅ Plan gating on `/practice` per persona — `specs/personas.spec.ts`.
- ✅ A full **typed** interview end to end with feedback-contract assertions — `specs/candidate-typed.spec.ts`.
- ✅ Corporate admin journey — dashboard, invite a recruiter, assign an assessment, plus the **seat-limit** and **trial-cap** `403` rejections — `specs/corporate-admin.spec.ts`.
- ✅ Assessment centre — the full three-stage pipeline (case study → interview/brief → presentation/report) driven at the API level — `specs/assessment-centre.spec.ts`.
- ✅ Standalone AI / analysis routes — `specs/ai-routes.spec.ts`: STAR scorer, transcript cleaner, voice-analysis + video-analysis (pure scoring, no AI), and the whisper-filler paid-plan gate.
- ✅ Career-doc generators (Professional) — personal statement, cover letter, CV enhancer, plus the Plus-persona `403` — `specs/career-docs.spec.ts`.
- Deterministic and ~free via the AI mock seam (`AIM_TEST_MODE=mock`).
- ♻️ **Real-AI nightly** — the `@real-ai`-tagged subset (typed interview + AC pipeline + STAR scorer + CV enhancer) re-run against the live OpenAI API to catch parser/contract drift (see below).

- ✅ **Stripe checkout (test mode)** — candidate + corporate checkout routes return a real `checkout.stripe.com` session URL — `specs/stripe.spec.ts`. Opt-in: tagged `@stripe`, excluded from the default pack, and **skips** unless `STRIPE_SECRET_KEY` is an `sk_test_` key (so it can never hit live). Run with `npm run test:pack:stripe` after adding `sk_test_` + the `STRIPE_PRICE_*` test ids to `.env.test`.

Not covered by automation: the browser's live **voice/camera capture** (getUserMedia
+ the client-side camera ML that *produces* the metrics — the scoring routes that
*consume* them ARE covered above); routes that gate on the JWT `metadata` claim can
only assert the reject case (`@clerk/testing` tokens don't surface private_metadata
to a route handler — the resolver is covered by the unit matrix); and Stripe's
**hosted card page + webhook→entitlement** flow (rehearse with a test card per the
GO-LIVE "Rehearse in Stripe TEST mode" section).

## One-time setup (required to RUN the pack)
The pack seeds users + runs interviews, so it needs a throwaway/test environment
— **never production values.**

1. **A dedicated test Clerk instance** (free): Clerk Dashboard → create a new
   application / development instance. Copy its `pk_test_…` + `sk_test_…`.
   In it, set the session token to map `metadata = {{user.private_metadata}}`
   (Dashboard → Sessions → customize) so `/practice` SSR sees the plan.
2. **Install the test deps:** `npm install` (adds `@clerk/testing` + `@clerk/backend`).
3. **Create `.env.test`** (gitignored) — test values only:
   ```
   AIM_TEST_MODE=mock
   PLAYWRIGHT_BASE_URL=http://localhost:3000     # or a Vercel preview URL
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx
   AIM_TEST_PASSWORD=Test-Passw0rd!2026
   DATABASE_URL=postgresql://...                 # REQUIRED — /practice reads the DB (a Neon branch is easiest)
   ```
4. **Run it** (load `.env.test` into the Playwright process):
   ```
   npx dotenv-cli -e .env.test -- npm run test:pack
   ```
   - **Local**: the config boots `npm run dev` and FORWARDS your `.env.test`
     values (Clerk keys, DATABASE_URL, AIM_TEST_MODE) to it — so only `.env.test`
     is needed; no `.env.local` juggling.
   - **Preview**: set `PLAYWRIGHT_BASE_URL` to a preview deployment whose Vercel
     env has `AIM_TEST_MODE=mock` + the test Clerk keys; the `CLERK_*` vars above
     are still needed by the test process (for seeding + the testing token).

## Run
| Command | What |
|---|---|
| `npm test` | unit suite incl. the persona matrix (no infra) |
| `npm run test:pack` | the full pack (mocked AI; excludes `@stripe`) |
| `npm run test:pack:real` | only the `@real-ai` subset, against the live OpenAI API |
| `npm run test:pack:stripe` | only the `@stripe` subset — checkout-session creation in Stripe **test mode** |
| `npm run test:pack:ui` | Playwright UI mode |

## Real-AI nightly (optional)
`npm run test:pack:real` runs only the `@real-ai`-tagged tests (one typed
interview + the assessment-centre pipeline) with `AIM_TEST_MODE=real`, so they
hit the real OpenAI API and exercise the live response parsers. Locally
(PowerShell), after adding `OPENAI_API_KEY` to `.env.test`:
```
$env:AIM_TEST_MODE="real"; npx dotenv-cli -e .env.test -- npm run test:pack:real
```
Stop any running dev server first — `reuseExistingServer` would otherwise reuse
one still booted in mock mode.

A GitHub Actions workflow (`.github/workflows/nightly-real-ai.yml`) runs this on
a nightly schedule. It **skips cleanly** until these repo secrets are set
(Settings → Secrets and variables → Actions): `OPENAI_API_KEY`,
`TEST_DATABASE_URL`, `TEST_CLERK_SECRET_KEY`, `TEST_CLERK_PUBLISHABLE_KEY`, and
optionally `AIM_TEST_PASSWORD`.

## How it works
- **setup** project → Clerk testing token (`setup/global.setup.ts`).
- **auth** project → seeds each persona via the Backend SDK + signs in via
  `@clerk/testing`, saving `tests/e2e/pack/.auth/<persona>.json` (gitignored).
- **chromium** project → runs the specs using each persona's `storageState`.
- **cleanup** → deletes the seeded users so reruns start clean.

## data-testids (added)
The bot reads two stable hooks (with robust role/text fallbacks if ever removed):
- `data-testid="question-text"` on the question `<p>` in
  `app/practice/session/components/QuestionHero.tsx`.
- `data-testid="overall-score"` on the score node in the feedback/summary panel.

## First-run note
The Clerk seed + sign-in path is the one version-sensitive part. If
`auth.setup.ts` times out on the first run it's almost always the test Clerk
instance config (the session-token `metadata` claim, or wrong keys) — check
those first. The `@clerk/testing` helper is also documented to be flaky with
concurrent workers, so the config pins `workers: 1`.
