import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Global middleware.
 *
 * Superadmin accounts (privateMetadata.role === "superadmin") must NEVER
 * access candidate or corporate areas. They are redirected to /admin.
 *
 * For this to work, Clerk must embed privateMetadata in the session JWT:
 *   Clerk Dashboard → Configure → Sessions → Customize session token
 *   Add: { "metadata": "{{user.private_metadata}}" }
 */

const isCandidateArea = createRouteMatcher(["/practice(.*)"]);
const isCorporateArea = createRouteMatcher(["/company(.*)"]);
const isAdminArea     = createRouteMatcher(["/admin(.*)"]);
const isAdminSignIn   = createRouteMatcher(["/admin/sign-in(.*)"]);

// Routes that require authentication
const isProtected = createRouteMatcher([
  "/practice(.*)",
  "/company(.*)",
  "/accept-terms(.*)",
  "/change-password(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // ── Superadmin guard ────────────────────────────────────────────────────
  // Block superadmins from candidate/corporate areas entirely.
  if (userId && (isCandidateArea(req) || isCorporateArea(req))) {
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
