/** Capture-only setup: enrich the test DB with believable demo data. */
import { test } from "@playwright/test";
import { seedDemoData } from "./demoSeed";

test("seed demo data", async () => {
  test.setTimeout(90_000);
  const r = await seedDemoData();
  console.log(`demo seed → ${r.sessions} candidate sessions, company=${r.company}`);
});
