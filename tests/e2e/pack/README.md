# Automated test pack

Seeds candidate logins for every plan and drives a **simulated candidate through
a full typed interview** (plus per-persona plan gating), so you stop running
manual cases.

Everything lives under `tests/e2e/pack/` and runs via a **separate** Playwright
config (`playwright.tests.config.ts`). The production smoke suite
(`tests/e2e/smoke.spec.ts` via `playwright.config.ts`) is untouched and
`testIgnore`s this folder, so the pack can never run against production.

## What it covers today (Phase 1 + 2)
- ✅ Persona entitlement matrix (pure unit) — `tests/unit/candidatePlan.persona.test.ts`, runs in `npm test`.
- ✅ Persona logins: Free / Trial / Plus / Professional, seeded via Clerk `privateMetadata` (no Stripe).
- ✅ Plan gating on `/practice` per persona — `specs/personas.spec.ts`.
- ✅ A full **typed** interview end to end with feedback-contract assertions — `specs/candidate-typed.spec.ts`.
- Deterministic and ~free via the AI mock seam (`AIM_TEST_MODE=mock`).

By design NOT covered yet: voice & camera (fake media = plumbing only),
real-AI answer quality (nightly smoke), corporate + assessment-centre (Phase 3),
and live Stripe checkout.

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
   # DATABASE_URL=...                            # only for corporate/AC seeding (Phase 3)
   ```
4. **Run it** (load `.env.test` into the Playwright process):
   ```
   npx dotenv-cli -e .env.test -- npm run test:pack
   ```
   - **Local**: the config boots `npm run dev` with `AIM_TEST_MODE=mock`. The dev
     server reads Clerk keys from `.env.local`, so put the **test** `pk_test_/sk_test_`
     there while testing (or run against a preview instead).
   - **Preview**: set `PLAYWRIGHT_BASE_URL` to a preview deployment whose Vercel
     env has `AIM_TEST_MODE=mock` + the test Clerk keys; the `CLERK_*` vars above
     are still needed by the test process (for seeding + the testing token).

## Run
| Command | What |
|---|---|
| `npm test` | unit suite incl. the persona matrix (no infra) |
| `npm run test:pack` | the full pack (mocked AI) |
| `npm run test:pack:ui` | Playwright UI mode |

## How it works
- **setup** project → Clerk testing token (`setup/global.setup.ts`).
- **auth** project → seeds each persona via the Backend SDK + signs in via
  `@clerk/testing`, saving `tests/e2e/pack/.auth/<persona>.json` (gitignored).
- **chromium** project → runs the specs using each persona's `storageState`.
- **cleanup** → deletes the seeded users so reruns start clean.

## Optional hardening (recommended, zero behaviour change)
Add two `data-testid`s so the bot doesn't rely on text/class locators:
- `data-testid="question-text"` on the question `<p>` in
  `app/practice/session/components/QuestionHero.tsx`.
- `data-testid="overall-score"` on the score node in the feedback/summary panel.
The bot already falls back to robust role/text locators without them.

## First-run note
The Clerk seed + sign-in path is the one version-sensitive part. If
`auth.setup.ts` times out on the first run it's almost always the test Clerk
instance config (the session-token `metadata` claim, or wrong keys) — check
those first. The `@clerk/testing` helper is also documented to be flaky with
concurrent workers, so the config pins `workers: 1`.
