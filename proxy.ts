import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Global middleware (served as proxy.ts on Vercel — do not rename to middleware.ts).
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
]);

export default clerkMiddleware(async (auth, req) => {
  // ── Canonical host ──────────────────────────────────────────────────────
  // Redirect the bare apex to www so there's a single canonical origin
  // (matches siteConfig.url, all OG/canonical/email links). Exact match only,
  // so preview/localhost hosts are unaffected.
  const host = req.headers.get("host");
  if (host === "aicareermentor.co.uk") {
    const url = new URL(req.url);
    url.host = "www.aicareermentor.co.uk";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const { userId, sessionClaims } = await auth();

  // ── Superadmin guard ────────────────────────────────────────────────────
  // Superadmin accounts must ONLY access /admin pages. Any signed-in
  // superadmin hitting any other page is redirected to /admin.
  // Requires Clerk session token customisation — see comment at top of file.
  if (userId && !isAdminArea(req) && !isApiRoute(req)) {
    const role = (sessionClaims as { metadata?: { role?: string } } | null)
      ?.metadata?.role;
    if (role === "superadmin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  // ── Admin area: require auth (but not from sign-in page itself) ─────────
  if (isAdminArea(req) && !isAdminSignIn(req)) {
    await auth.protect();
  }

  // ── Candidate / corporate areas: require auth ───────────────────────────
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
