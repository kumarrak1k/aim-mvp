# Go-Live Runbook — switching to live Stripe + real users

> The codebase is already hardened (production audit, May 2026). This is the
> **operational** checklist — the dashboard/env steps that can't live in code.
> Do them in order. Nothing here requires a code change.
>
> ✅ Verify readiness any time with the one-click probe (signed in as superadmin):
> **`GET https://aicareermentor.co.uk/api/admin/go-live-check`** → expect `"ready": true`.

---

## 0. Pre-flight (do these first, can be done now)

- [x] **Neon `DATABASE_URL` — already correct, no change needed.** Neon's connection **pooler natively supports prepared statements**, so the pooled (`-pooler`) host is scale-safe **without** `pgbouncer=true`. Neon's own Prisma preset (Console → Connect → Prisma + Pooled) uses `?sslmode=require&channel_binding=require` and omits `pgbouncer` — which is exactly what's in production now. The earlier "add pgbouncer" idea was generic PgBouncer advice that does **not** apply to Neon; adding it would only risk an outage. **Leave `DATABASE_URL` as Neon's pooled preset.** (If you ever migrate off Neon to raw PgBouncer, *then* you'd need `pgbouncer=true&connection_limit=1` — and only via Neon-style presets, never by hand-editing the password area.)
- [x] **`CRON_SECRET`** set in Vercel (confirmed 2026-06-01). Both crons (nurture + reconcile) fail closed without it.
- [ ] **Cron frequency.** `vercel.json` runs two daily jobs — `/api/cron/nurture` (`0 9 * * *`, emails) and `/api/cron/reconcile` (`0 3 * * *`, the Stripe↔DB safety-net below). Both are Hobby-compatible (Vercel allows 100 daily crons per project since Jan 2026) and use the same `CRON_SECRET`. For faster trial/nurture emails, either upgrade to Vercel Pro and change nurture to `*/10 * * * *`, **or** point an external scheduler (e.g. cron-job.org) at `https://aicareermentor.co.uk/api/cron/nurture` every 10 min with header `Authorization: Bearer <CRON_SECRET>`.
- [ ] **Clerk:** confirm Production uses **live** Clerk keys (`pk_live_`/`sk_live_`), and the JWT session token maps `metadata = {{user.private_metadata}}` (needed so `/practice` SSR sees plan/trial fields).
- [ ] **Resend:** domain `aicareermentor.co.uk` verified with **SPF, DKIM, and a DMARC** record. Warm the domain before bulk nurture.
- [ ] **Upstash:** `UPSTASH_REDIS_REST_URL` / `_TOKEN` set in Production (rate limits multiply per-instance without it).

---

## 1. Stripe — create live products & prices

In the Stripe Dashboard, **toggle to live mode**, then recreate every product/price (test-mode price IDs are invalid in live):

- [ ] Plus — monthly £19, annual £169
- [ ] Professional — monthly £29, annual £249
- [ ] Corporate Team — monthly £149, annual £1,193
- [ ] Corporate Business — monthly £399, annual £3,192
- [ ] (Optional but recommended) give each price a **lookup key** containing `plus`/`professional` so the webhook fallback resolves correctly.

Copy each **live** `price_…` id into Vercel Production env:

```
STRIPE_PRICE_PLUS_MONTHLY / _ANNUAL
STRIPE_PRICE_PROFESSIONAL_MONTHLY / _ANNUAL
STRIPE_PRICE_CORPORATE_TEAM_MONTHLY / _ANNUAL
STRIPE_PRICE_CORPORATE_BUSINESS_MONTHLY / _ANNUAL
```

---

## 2. Stripe — keys, webhooks, retries

- [ ] Set **live** keys in Vercel: `STRIPE_SECRET_KEY=sk_live_…`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…`.
- [ ] Create **two** live webhook endpoints:
  - **Candidate** → `https://aicareermentor.co.uk/api/stripe/webhook`
    events: `customer.subscription.created`, `…updated`, `…deleted`
  - **Corporate** → `https://aicareermentor.co.uk/api/webhooks/stripe`
    events: `checkout.session.completed`, `customer.subscription.created`, `…updated`, `…deleted`
  - Copy each signing secret → `STRIPE_WEBHOOK_SECRET` (candidate) and `STRIPE_WEBHOOK_SECRET_CORPORATE` (corporate).
- [ ] **Billing → Subscriptions → Smart Retries:** set the failed-payment retry schedule to **cancel** the subscription at the end (so `past_due` can't grant free access indefinitely).
- [ ] Set **`NEXT_PUBLIC_PAYMENTS_ENABLED=true`** (otherwise upgrade/subscribe buttons stay hidden).

---

## Rehearse in Stripe TEST mode first (recommended)

Before the live flip, rehearse the whole payment flow with **test** keys and
**test** cards — no real money, fully reversible. Do it in a throwaway/staging
env (or locally), never against the live DB.

1. In Stripe **test mode**, create the same products/prices as §1, and put the
   `sk_test_…` key + the `STRIPE_PRICE_*` **test** ids into your test env
   (`.env.test` locally, or a staging Vercel env).
2. **Automated — session creation:** `npm run test:pack:stripe` (in the test pack).
   It signs in a candidate + a corporate admin and asserts both checkout routes
   return a real `checkout.stripe.com` session URL with your test prices. It
   **skips itself** unless `STRIPE_SECRET_KEY` is an `sk_test_` key, so it can
   never hit live.
3. **Manual — full flow:** open a candidate Plus checkout and pay with Stripe's
   test card `4242 4242 4242 4242` (any future expiry / any CVC); confirm
   `/practice` shows the paid plan within ~1 min. Repeat for a corporate Team
   checkout from the dashboard → `Company.planStatus` becomes `active`. In
   Stripe → Webhooks (test mode), confirm both endpoints show **200**. Cancel via
   the billing portal → confirm access reverts.

These are the same assertions as the live smoke in §3 — proving them in test mode
first means the live flip is just a key swap.

---

## 3. Flip + verify

- [ ] Redeploy (or it auto-deploys on the env change).
- [ ] Hit **`/api/admin/go-live-check`** as superadmin → confirm `"ready": true`, `"stripeMode": "live"`, and every price `ok`.
- [ ] **Smoke test with a real card** (you can refund): candidate Plus checkout → confirm `/practice` shows the paid plan within ~1 min; corporate Team checkout from the dashboard → confirm `Company.planStatus` becomes `active`.
- [ ] In Stripe → Webhooks, confirm both endpoints show **200** deliveries.
- [ ] Cancel the test sub via the billing portal → confirm access reverts.

---

## 4. Database schema & migrations (NOT a go-live blocker)

**Current reality:** the schema is maintained with `prisma db push`. Some tables
were added that way and have **no migration file**, so `prisma/migrations/`
can't rebuild the DB on its own. The Vercel build runs `prisma generate && next
build` — it does **not** run `prisma migrate deploy`, so nothing is ever
auto-applied to prod. **The live DB is healthy and this works as-is.** Neon's
pooler supports prepared statements, so no `pgbouncer=true` is needed.

A complete, shadow-DB-free DDL snapshot of the whole schema lives at
**`prisma/baseline/0001_baseline.sql`** (see `prisma/baseline/README.md`). It's
your DR / fresh-environment bootstrap and the reviewable source of truth.
Regenerate it after any `schema.prisma` change:

```bash
npx prisma migrate diff --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/baseline/0001_baseline.sql   # no DB connection needed
```

### Option A — stay on `db push` (recommended, no action needed)

It's working, needs no shadow DB, and survives Neon's pooler. After editing
`schema.prisma`: `npx prisma db push` (or `db push --skip-generate && prisma
generate`), then regenerate the baseline snapshot above and commit both. Done.

### Option B — graduate to real migrations (optional, do this off the live DB)

Best done when standing up a **fresh** DB (e.g. staging from the baseline), not
retrofitted onto the live DB under load. When you're ready:

```bash
# 1. Archive the 5 partial pre-drift migrations so they don't double-create.
mkdir -p prisma/migrations_archive && mv prisma/migrations/2026* prisma/migrations_archive/

# 2. Promote the full baseline to the single first migration.
mkdir -p prisma/migrations/0_init
cp prisma/baseline/0001_baseline.sql prisma/migrations/0_init/migration.sql

# 3. On the target DB, mark it applied WITHOUT running it (tables already exist).
#    RUN THIS ONCE, BY HAND, against the intended DB. NEVER wire it into CI for
#    the existing prod DB — it must not re-run DDL on live tables.
npx prisma migrate resolve --applied 0_init
npx prisma migrate status   # verify: "Database schema is up to date"

# 4. ONLY after step 3 is confirmed, add deploy to the build:
#    "build": "prisma generate && prisma migrate deploy && next build"
# 5. From then on: `prisma migrate dev` locally → commit → deploy applies it.
```

> ⚠️ If prod's `_prisma_migrations` already recorded the 5 old dated migrations,
> `migrate status` will flag them as "applied but missing locally" after step 1.
> That's cosmetic (they're archived, not deleted); leave them or clean up only
> with a reviewed `migrate resolve`. Don't let it block you — verify status,
> don't guess.

---

## Done since the audit (no longer outstanding)
Moderation on assessment-centre / career-doc / clean-transcript inputs · Resend bounce/complaint webhook + suppression · self-serve account deletion (GDPR Art. 17) · apex canonicalisation (Vercel www→apex + apex `siteConfig.url`, all canonical/OG/sitemap/webhook URLs on the apex) · transaction around session-save + assignment-complete · `CandidateAssignment.template` `onDelete: Cascade` · `Content-Security-Policy` (report-only) · corporate **annual** checkout UI · candidate checkout idempotency + dunning/`past_due` handling · email suppression purge in cron · schema baseline snapshot + migration runbook · nightly Stripe↔DB reconcile safety-net cron (`/api/cron/reconcile`, runs `0 3 * * *`; re-syncs any subscription whose webhook Stripe couldn't deliver, sharing the webhooks' mapping helpers so it can't drift).

## Still deferred (not blockers, schedule post-launch)
- **Promote CSP from report-only to enforcing** — collect `report-only` violations for a week first, then flip the header once the allowlist is proven clean.
- **Sub-daily reconcile (optional)** — the reconcile cron already runs daily, which is plenty as a webhook safety net. For tighter drift detection, point an external scheduler at `/api/cron/reconcile` (Bearer `CRON_SECRET`) more frequently, or move to Vercel Pro.
- **Migration adoption (GO-LIVE §4 Option B)** — only if/when you want `db push` replaced by enforced migrations; best done off a fresh DB.
