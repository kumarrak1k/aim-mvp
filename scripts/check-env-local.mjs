/**
 * Pre-dev guard: refuse to start the dev server when .env.local points at a
 * different database from .env.
 *
 * Why this exists (2026-07-20): Next.js loads .env.local BEFORE .env, so it
 * silently wins. A `vercel link` / `vercel env pull` run while this folder was
 * mislinked to the OTHER site's Vercel project wrote that site's credentials
 * into .env.local — and `npm run dev` here then connected to the OTHER site's
 * LIVE production database. It went unnoticed until a webhook test wrote rows
 * into the wrong site's data.
 *
 * Vercel can recreate .env.local at any time, so this compares the two hosts
 * on every dev start and fails loudly rather than silently cross-wiring.
 * Prints hostnames only — never credentials.
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

/** Host of a connection-string env var, or null. Credentials are discarded. */
function hostOf(file, key) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  const line = fs
    .readFileSync(full, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  if (!line) return null;
  const value = line.slice(key.length + 1).replace(/^["']|["']$/g, "");
  const match = value.match(/@([^/?]+)/);
  return match ? match[1] : null;
}

const envHost = hostOf(".env", "DATABASE_URL");
const localHost = hostOf(".env.local", "DATABASE_URL");

// No .env.local, or it sets no database: nothing can be cross-wired.
if (localHost && envHost && localHost !== envHost) {
  console.error(`
┌─────────────────────────────────────────────────────────────────────┐
│  BLOCKED: .env.local points at a DIFFERENT database than .env       │
└─────────────────────────────────────────────────────────────────────┘

  .env.local  ->  ${localHost}
  .env        ->  ${envHost}

  .env.local takes priority in Next.js, so the dev server would use the
  first host above. If that is the other site's database, you would be
  reading and WRITING ITS LIVE DATA.

  This usually means a 'vercel link' or 'vercel env pull' ran while this
  folder was linked to the wrong Vercel project. Check the link with:

      cat .vercel/project.json          (expect projectName: aim-mvp)

  Then either delete .env.local, or re-pull it from the correct project.
`);
  process.exit(1);
}

if (localHost && !envHost) {
  console.warn(
    `\n  Note: .env.local sets DATABASE_URL (${localHost}) and .env does not.\n` +
      `  Confirm that host belongs to THIS site before continuing.\n`
  );
}
