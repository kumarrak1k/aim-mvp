# Schema baseline snapshot

`0001_baseline.sql` is a **complete DDL snapshot of the entire current Prisma
schema** (all tables, indexes, foreign keys) — generated straight from
`prisma/schema.prisma`, with **no database connection and no shadow database**:

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/baseline/0001_baseline.sql
```

## Why this lives here and not in `prisma/migrations/`

The production schema is currently maintained with **`prisma db push`**, not
`prisma migrate`. Several tables were added that way and have no migration file,
so the `prisma/migrations/` history can't rebuild the DB on its own. The Vercel
build runs `prisma generate && next build` — it does **not** run
`prisma migrate deploy`, so nothing here is ever auto-applied to production.

Keeping this snapshot **outside** `prisma/migrations/` is deliberate: dropping a
full-schema `CREATE TABLE` script next to the dated migrations would corrupt a
future `prisma migrate deploy` (it would try to recreate tables the other
migrations also create).

## What it's for

- **Disaster recovery / fresh environments.** Run this one file against an empty
  Postgres to stand up a schema-identical database (staging, a DR replica, a
  local clone). Follow with `prisma generate`.
- **Reviewable source of truth.** A diffable record of the live schema in git.

## Keep it current

Regenerate (command above) after any `schema.prisma` change so the snapshot
keeps matching production. It takes no DB access, so it's safe to run anytime.

See **GO-LIVE.md → "Database schema & migrations"** for the (optional) procedure
to graduate from `db push` to a real migration baseline.
