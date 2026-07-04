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

  // ── Admin area: require auth ────────────────────────────────────────────
  if (isAdminArea(req) && !isAdminSignIn(req)) {
    await auth.protect();
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
