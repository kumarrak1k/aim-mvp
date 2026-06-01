/**
 * Global Clerk setup — obtains a Testing Token for the run so subsequent
 * clerk.signIn() calls bypass bot detection. Reads CLERK_PUBLISHABLE_KEY and
 * CLERK_SECRET_KEY (of the TEST Clerk instance) from the environment.
 */
import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

setup("clerk testing token", async () => {
  await clerkSetup();
});
