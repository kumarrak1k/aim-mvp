import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Next.js edge middleware — must be named middleware.ts at the project root.
 *
 * Superadmin accounts (privateMetadata.role === "superadmin") must NEVER
 * access candidate or corporate areas. They are redirected to /admin.
 *
 * For this to work, Clerk must embed privateMetadata in the session JWT:
 *   Clerk Dashboard → Configure → Sessions → Customize session token
 *   Add: { "metadata": "{{user.private_metadata}}" }
 */

const isAdminArea   = createRouteMatcher(["/admin(.*)"]);
const isAdminSignIn = createRouteMatcher(["/admin/sign-in(.*)"]);
const isApiRoute    = createRouteMatcher(["/api(.*)"]);

// Routes that require authentication
const isProtected = createRouteMatcher([
  "/practice(.*)",
  "/company(.*)",
  "/accept-terms(.*)",
  "/change-password(.*)",
  "/profile(.*)",
  "/progress(.*)",
  "/assessment-centre(.*)",
  "/career-docs(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Canonicalisation is handled at the Vercel platform level (www → apex 307).
  // Do NOT add an apex → www redirect here — it fights Vercel's redirect and
  // creates an infinite loop.

  const { userId, sessionClaims } = await auth();

  // ── Superadmin guard ────────────────────────────────────────────────────
  // Superadmin accounts must ONLY access /admin pages.
  if (userId && !isAdminArea(req) && !isApiRoute(req)) {
    const role = (sessionClaims as { metadata?: { role?: string } } | null)
      ?.metadata?.role;
    if (role === "superadmin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // ── Admin area: IP allowlist, then auth + MFA step-up ──────────────────
  // ADMIN_ALLOWED_IPS (comma-separated) gates the ENTIRE admin area incl.
  // the sign-in page. Unset = allowlist off (safe rollout; set it in Vercel
  // to arm). If locked out after an ISP IP change, clear the env var in the
  // Vercel dashboard and redeploy — the dashboard is not behind this gate.
  if (isAdminArea(req)) {
    const allowlist = (process.env.ADMIN_ALLOWED_IPS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowlist.length > 0) {
      const clientIp = (req.headers.get("x-forwarded-for") ?? "")
        .split(",")[0]
        .trim();
      if (!allowlist.includes(clientIp)) {
        return new NextResponse("Not found", { status: 404 });
      }
    }
  }

  if (isAdminArea(req) && !isAdminSignIn(req)) {
    // Explicit redirect to OUR branded admin sign-in. Without this, a bare
    // auth.protect() sends signed-out visitors to Clerk's hosted account
    // portal (and returns 404 to non-browser requests).
    if (!userId) {
      return NextResponse.redirect(new URL("/admin/sign-in", req.url));
    }
    // MFA step-up ONLY for accounts that actually have a second factor.
    // Clerk v7's protect() 404s any signed-in user who cannot satisfy the
    // reverification (v6 waved them through), which locked admins out
    // entirely on instances where MFA is not enabled. The fva claim is
    // [firstFactorAge, secondFactorAge] in minutes; -1 = no second factor.
    const fva = (sessionClaims as { fva?: [number, number] } | null)?.fva;
    const hasSecondFactor = Array.isArray(fva) && fva[1] !== -1;
    if (hasSecondFactor) {
      await auth.protect({ reverification: { level: "second_factor", afterMinutes: 10 } });
    }
  }

  // ── Protected candidate / corporate areas ───────────────────────────────
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
