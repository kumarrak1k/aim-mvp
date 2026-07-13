import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/app/config/site";
import { generateSlug } from "@/app/lib/company";
import { sendAdminWelcomeEmail } from "@/app/lib/email";
import { prisma } from "@/app/lib/prisma";
import { checkRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireSuperadmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const meta = me.privateMetadata as { role?: string };
  if (meta.role !== "superadmin") return null;
  return { callerId: userId, client };
}

function generateInternalPassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const symbols = "!@#$%&*";
  const all     = upper + lower + digits + symbols;

  const chars: string[] = [
    upper  [Math.floor(Math.random() * upper.length)],
    upper  [Math.floor(Math.random() * upper.length)],
    lower  [Math.floor(Math.random() * lower.length)],
    lower  [Math.floor(Math.random() * lower.length)],
    digits [Math.floor(Math.random() * digits.length)],
    digits [Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    ...Array.from({ length: 9 }, () => all[Math.floor(Math.random() * all.length)]),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}

function signInPathForType(_accountType: string): string {
  // All admin-issued links go to the dedicated token-acceptance page
  // (/auth/accept) which shows only a spinner while Clerk processes the
  // __clerk_ticket — no marketing shell, no "Hiring team?" links.
  return "/auth/accept";
}

/**
 * POST /api/admin/users
 * Create a Clerk account, generate a sign-in token, and immediately email
 * the one-click link to the user via Resend.
 *
 * Returns: { success, userId, email, signInUrl, emailSent, emailError? }
 * - signInUrl   always returned so the UI can show a copy-link fallback
 * - emailSent   true if Resend accepted the email
 * - emailError  human-readable reason if email sending failed
 */
export async function POST(req: NextRequest) {
  const admin = await requireSuperadmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 403 });
  }

  const rl = await checkRateLimit(admin.callerId, "admin-create-user", 20, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as {
    email?: string;
    firstName?: string;
    lastName?: string;
    accountType?: string;
    subscriptionStatus?: string;
    stripePlanId?: string;
    // Complimentary guest access (no card, no Stripe; expires automatically)
    compPlan?: string;   // candidate: plus|professional · corporate: team|business
    compUntil?: string;
    companyName?: string; // corporate comp: workspace is pre-created with this name
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!body.accountType) {
    return NextResponse.json({ error: "Account type is required." }, { status: 400 });
  }

  try {
    // 1. Create Clerk account
    const privateMetadata: Record<string, unknown> = {
      accountType: body.accountType,
      forcePasswordReset: true,
    };
    if (body.subscriptionStatus) privateMetadata.subscriptionStatus = body.subscriptionStatus;
    if (body.stripePlanId)        privateMetadata.stripePlanId       = body.stripePlanId;

    // Complimentary access at creation: guests arrive with the plan already
    // active, so no second admin step is needed.
    const compPlan = (body.compPlan ?? "").toLowerCase();
    const compUntilValid =
      Boolean(body.compUntil) && !Number.isNaN(new Date(body.compUntil!).getTime());
    if (
      body.accountType === "candidate" &&
      (compPlan === "plus" || compPlan === "professional") &&
      compUntilValid
    ) {
      privateMetadata.compPlan  = compPlan;
      privateMetadata.compUntil = new Date(body.compUntil!).toISOString();
    }
    const corporateComp =
      body.accountType === "corporate" &&
      (compPlan === "team" || compPlan === "business") &&
      compUntilValid &&
      Boolean(body.companyName?.trim());
    if (
      body.accountType === "corporate" &&
      compPlan &&
      !corporateComp
    ) {
      return NextResponse.json(
        { error: "Corporate complimentary access needs a valid plan (team or business), an end date, and a company name." },
        { status: 400 }
      );
    }

    const user = await admin.client.users.createUser({
      emailAddress: [email],
      password: generateInternalPassword(),
      firstName: body.firstName?.trim() || undefined,
      lastName: body.lastName?.trim() || undefined,
      skipPasswordChecks: true,
      privateMetadata,
    });

    // 1b. Corporate comp: pre-create the workspace with this person as its
    // admin, so their first sign-in lands on a ready dashboard instead of the
    // setup page. planStatus "comp" self-expires via compUntil (isPlanActive).
    if (corporateComp) {
      const name = body.companyName!.trim();
      const baseSlug = generateSlug(name);
      let slug = baseSlug;
      let attempt = 0;
      while (await prisma.company.findUnique({ where: { slug } })) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }
      await prisma.company.create({
        data: {
          name,
          slug,
          planId: compPlan,
          planStatus: "comp",
          compUntil: new Date(body.compUntil!),
          members: {
            create: { clerkUserId: user.id, role: "admin" },
          },
        },
      });
    }

    // 2. Generate sign-in token (7 days, one-time use, bypasses MFA/factor-two)
    const tokenResponse = await admin.client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 7 * 24 * 60 * 60,
    });

    const signInPath = signInPathForType(body.accountType);
    const signInUrl = `${siteConfig.url}${signInPath}?__clerk_ticket=${tokenResponse.token}`;

    // 3. Send welcome email immediately — non-fatal if it fails
    let emailSent = false;
    let emailError: string | undefined;

    try {
      const emailResult = await sendAdminWelcomeEmail({
        to: email,
        firstName: body.firstName?.trim() || null,
        signInUrl,
      });

      if (emailResult.ok) {
        emailSent = true;
      } else {
        emailError = emailResult.error;
        console.error("ADMIN WELCOME EMAIL FAILED:", emailResult.error);
      }
    } catch (emailErr) {
      emailError = emailErr instanceof Error ? emailErr.message : "Email send failed.";
      console.error("ADMIN WELCOME EMAIL EXCEPTION:", emailErr);
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email,
      signInUrl,   // always returned so UI can show copy-link fallback
      emailSent,
      emailError,
    });
  } catch (error: unknown) {
    console.error("ADMIN CREATE USER ERROR:", error);
    const msg =
      (error as { errors?: Array<{ longMessage?: string; message?: string }> })
        ?.errors?.[0]?.longMessage ??
      (error as { errors?: Array<{ message?: string }> })
        ?.errors?.[0]?.message ??
      "Failed to create user.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
