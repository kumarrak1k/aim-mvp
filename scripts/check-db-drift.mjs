/**
 * Schema drift check: does every database this repo talks to actually match
 * prisma/schema.prisma?
 *
 * Why this exists: one schema serves three databases (.co.uk prod, .com prod,
 * and the shared test branch). Schema changes are applied with `prisma db push`
 * per database, so it is easy to update one and forget another — and a missing
 * column is not a build error, it is a runtime crash in front of a user.
 *
 * Run after ANY schema change:  npm run db:drift
 * Exits non-zero if a database is behind, so it can gate a deploy later.
 * Prints hostnames only — never credentials.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const TARGETS = [
  { file: ".env", label: "production" },
  { file: ".env.test", label: "test branch" },
];

function readDatabaseUrl(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return null;
  const line = fs
    .readFileSync(full, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("DATABASE_URL="));
  return line ? line.slice("DATABASE_URL=".length).replace(/^["']|["']$/g, "") : null;
}

const hostOf = (url) => url.match(/@([^/?]+)/)?.[1] ?? "unknown host";

const PRISMA_CLI = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
if (!fs.existsSync(PRISMA_CLI)) {
  console.error("Prisma CLI not found at node_modules/prisma/build/index.js — run npm install.");
  process.exit(1);
}

let failed = false;

for (const { file, label } of TARGETS) {
  const url = readDatabaseUrl(file);
  if (!url) {
    console.log(`SKIP  ${label.padEnd(12)} — no DATABASE_URL in ${file}`);
    continue;
  }

  try {
    // NOTE: no `shell: true`. On Windows a shell mangles these arguments and
    // Prisma silently receives none of them — which looked exactly like drift
    // and made this check cry wolf on its first run.
    execFileSync(
      // Run the Prisma CLI's entry point with this same Node binary: no shell,
      // no PATH lookup, no .cmd-vs-shell-script difference between platforms.
      process.execPath,
      [
        PRISMA_CLI,
        "migrate",
        "diff",
        "--from-url",
        url,
        "--to-schema-datamodel",
        "prisma/schema.prisma",
        "--exit-code", // 0 = identical, 2 = differences, anything else = error
      ],
      { stdio: "pipe" }
    );
    console.log(`OK    ${label.padEnd(12)} — ${hostOf(url)} matches schema`);
  } catch (err) {
    const output = `${String(err.stdout ?? "")}${String(err.stderr ?? "")}`;
    const detail = output
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.includes("://"))
      .slice(0, 12)
      .join("\n      ");

    if (err.status === 2) {
      failed = true;
      console.error(
        `DRIFT ${label.padEnd(12)} — ${hostOf(url)} is BEHIND prisma/schema.prisma\n      ${detail}\n` +
          `      Fix: apply the schema to this database (see the directUrl footgun note in memory).`
      );
    } else {
      // Could not run the comparison at all — report it as a broken check,
      // never as a clean pass and never as drift.
      failed = true;
      console.error(
        `ERROR ${label.padEnd(12)} — could not compare ${hostOf(url)} (exit ${err.status})\n      ${detail}`
      );
    }
  }
}

if (failed) {
  console.error("\nOne or more databases do not match the schema.");
  process.exit(1);
}
console.log("\nAll databases match prisma/schema.prisma.");
