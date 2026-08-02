import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  ADMIN_BYPASS_COOKIE,
  BYPASS_DAYS,
  createBypassToken,
  isValidBypassToken,
  timingSafeEqual,
} from "./app/lib/adminBypass";

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
const isAdminUnlock = createRouteMatcher(["/admin/unlock"]);
const isApiRoute    = createRouteMatcher(["/api(.*)"]);

// Routes that require authentication
const isProtected = createRouteMatcher([
  "/practice(.*)",
  "/onboarding(.*)",
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
  // the sign-in page. Unset = allowlist off.
  //
  // A device can also be authorised from any network by redeeming
  // /admin/unlock?key=<ADMIN_BYPASS_SECRET> once — see app/lib/adminBypass.ts.
  // That is what makes arming the allowlist safe: without it, an ISP IP change
  // locks you out until a redeploy, because middleware env vars are baked at
  // build time.
  if (isAdminArea(req)) {
    const bypassSecret = process.env.ADMIN_BYPASS_SECRET ?? "";

    // Redeem the unlock link. Handled BEFORE the IP gate — a blocked IP is
    // exactly who needs to use it, so gating it behind the allowlist would
    // make it useless.
    if (isAdminUnlock(req)) {
      const target = req.nextUrl.clone();
      target.pathname = "/admin";
      target.search = ""; // never leave the key in the address bar or history

      const supplied = req.nextUrl.searchParams.get("key") ?? "";
      if (!bypassSecret || !timingSafeEqual(supplied, bypassSecret)) {
        // 404, not 403 — a wrong key should not confirm the endpoint exists.
        return new NextResponse("Not found", { status: 404 });
      }

      const expiresAt = Date.now() + BYPASS_DAYS * 24 * 60 * 60 * 1000;
      const response = NextResponse.redirect(target);
      response.cookies.set(
        ADMIN_BYPASS_COOKIE,
        await createBypassToken(bypassSecret, expiresAt),
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: BYPASS_DAYS * 24 * 60 * 60,
        }
      );
      return response;
    }

    const allowlist = (process.env.ADMIN_ALLOWED_IPS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowlist.length > 0) {
      const clientIp = (req.headers.get("x-forwarded-for") ?? "")
        .split(",")[0]
        .trim();
      const allowed =
        allowlist.includes(clientIp) ||
        (await isValidBypassToken(
          bypassSecret,
          req.cookies.get(ADMIN_BYPASS_COOKIE)?.value
        ));
      if (!allowed) {
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
  // Explicit redirect, NOT auth.protect(). Clerk v7 changed protect() to return
  // a bare 404 for a caller it cannot authorise, where v6 redirected to sign-in
  // — the same change already documented for the admin MFA branch above. The
  // result was that every signed-out visit to /practice, /progress, /profile,
  // /career-docs or /assessment-centre hit a 404 instead of a sign-in page, so
  // a returning user with a bookmark or an expired session saw a broken site
  // rather than a login prompt.
  //
  // aicareermentor.com already carries this fix; it was never brought back here.
  if (isProtected(req) && !userId) {
    const isCompanyPath = /^\/company(\/|$)/.test(req.nextUrl.pathname);
    const dest = isCompanyPath ? "/for-business/sign-in" : "/for-candidates/sign-in";
    return NextResponse.redirect(new URL(dest, req.url));
  }
});

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
