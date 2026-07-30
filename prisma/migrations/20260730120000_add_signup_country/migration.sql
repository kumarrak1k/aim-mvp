-- Adds first-touch signup country (ISO 3166-1 alpha-2) captured from the edge.
-- Nullable with no default: metadata-only on Postgres, no table rewrite, and
-- existing rows are left NULL because their country was never recorded.
ALTER TABLE "UserProfile" ADD COLUMN "signupCountry" TEXT;
