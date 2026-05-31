# Go-Live Runbook — switching to live Stripe + real users

> The codebase is already hardened (production audit, May 2026). This is the
> **operational** checklist — the dashboard/env steps that can't live in code.
> Do them in order. Nothing here requires a code change.
>
> ✅ Verify readiness any time with the one-click probe (signed in as superadmin):
> **`GET https://www.aicareermentor.co.uk/api/admin/go-live-check`** → expect `"ready": true`.

---

## 0. Pre-flight (do these first, can be done now)

- [x] **Neon `DATABASE_URL` — already correct, no change needed.** Neon's connection **pooler natively supports prepared statements**, so the pooled (`-pooler`) host is scale-safe **without** `pgbouncer=true`. Neon's own Prisma preset (Console → Connect → Prisma + Pooled) uses `?sslmode=require&channel_binding=require` and omits `pgbouncer` — which is exactly what's in production now. The earlier "add pgbouncer" idea was generic PgBouncer advice that does **not** apply to Neon; adding it would only risk an outage. **Leave `DATABASE_URL` as Neon's pooled preset.** (If you ever migrate off Neon to raw PgBouncer, *then* you'd need `pgbouncer=true&connection_limit=1` — and only via Neon-style presets, never by hand-editing the password area.)
- [ ] **`CRON_SECRET`** set in Vercel (any long random string). The nurture cron fails closed without it.
- [ ] **Cron frequency.** `vercel.json` runs `/api/cron/nurture` once daily (`0 9 * * *`) — Hobby-compatible. For faster trial/nurture emails, either upgrade to Vercel Pro and change it to `*/10 * * * *`, **or** point an external scheduler (e.g. cron-job.org) at `https://www.aicareermentor.co.uk/api/cron/nurture` every 10 min with header `Authorization: Bearer <CRON_SECRET>`.
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
  - **Candidate** → `https://www.aicareermentor.co.uk/api/stripe/webhook`
    events: `customer.subscription.created`, `…updated`, `…deleted`
  - **Corporate** → `https://www.aicareermentor.co.uk/api/webhooks/stripe`
    events: `checkout.session.completed`, `customer.subscription.created`, `…updated`, `…deleted`
  - Copy each signing secret → `STRIPE_WEBHOOK_SECRET` (candidate) and `STRIPE_WEBHOOK_SECRET_CORPORATE` (corporate).
- [ ] **Billing → Subscriptions → Smart Retries:** set the failed-payment retry schedule to **cancel** the subscription at the end (so `past_due` can't grant free access indefinitely).
- [ ] Set **`NEXT_PUBLIC_PAYMENTS_ENABLED=true`** (otherwise upgrade/subscribe buttons stay hidden).

---

## 3. Flip + verify

- [ ] Redeploy (or it auto-deploys on the env change).
- [ ] Hit **`/api/admin/go-live-check`** as superadmin → confirm `"ready": true`, `"stripeMode": "live"`, and every price `ok`.
- [ ] **Smoke test with a real card** (you can refund): candidate Plus checkout → confirm `/practice` shows the paid plan within ~1 min; corporate Team checkout from the dashboard → confirm `Company.planStatus` becomes `active`.
- [ ] In Stripe → Webhooks, confirm both endpoints show **200** deliveries.
- [ ] Cancel the test sub via the billing portal → confirm access reverts.

---

## 4. Prisma migration baseline (before relying on migrations / a new env)

9 tables exist on prod via `db push` only, so `migrations/` can't rebuild the DB. The live DB is fine today; do this before any DR/staging rebuild:

```bash
# 1. Generate a baseline migration capturing current prod state (review the SQL)
npx prisma migrate diff --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma --script \
  > prisma/migrations/0_baseline/migration.sql
# 2. Mark it applied on prod WITHOUT re-running (it already exists)
npx prisma migrate resolve --applied 0_baseline
# 3. From now on: `prisma migrate dev` locally, `prisma migrate deploy` in CI.
```

---

## Deferred (not blockers, schedule post-launch)
Moderation on assessment-centre / career-doc / clean-transcript inputs · Resend bounce/complaint webhook + suppression · self-serve account deletion (GDPR Art. 17) · www↔apex 308 redirect · transaction around session-save + assignment-complete · `CandidateAssignment.template` `onDelete` · `Content-Security-Policy` header · corporate **annual** checkout UI · nightly Stripe↔DB reconcile job.
