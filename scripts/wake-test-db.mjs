// Wake the Neon test branch before running the e2e pack: the compute
// auto-suspends and the first cold connection can time out, which fails
// the pack's seeding step before any test runs.
// Run: npx dotenv-cli -e .env.test -- node scripts/wake-test-db.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
for (let i = 1; i <= 6; i++) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("db awake on attempt", i);
    process.exit(0);
  } catch (e) {
    console.log("attempt", i, "failed:", String(e.message).split("\n")[0]);
    await new Promise((r) => setTimeout(r, 5000));
  }
}
console.error("db did not wake");
process.exit(1);
