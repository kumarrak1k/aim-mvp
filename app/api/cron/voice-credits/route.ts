import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  ELEVENLABS_PLANS,
  LOW_CREDIT_CRITICAL,
  LOW_CREDIT_WARNING,
  allowanceState,
  creditsRemaining,
  elevenLabsCreditsUsed,
  usageThisMonth,
} from "@/app/lib/serviceUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Daily check on the interviewer voice allowance.
 *
 * The voice is prepaid: when the credits run out the questions stop being
 * read aloud, which is a visible product failure rather than a billing
 * footnote. This mails support in time to upgrade, at a fifth left and again
 * at a twentieth, so the first warning arrives with about a week of notice.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  try {
    const plan = (process.env.ELEVENLABS_PLAN || "free").toLowerCase();
    const allowance = ELEVENLABS_PLANS[plan] ?? ELEVENLABS_PLANS.free;
    const creditsUsed = await elevenLabsCreditsUsed();
    const remaining = creditsRemaining({ plan, creditsUsed });
    const state = allowanceState({ plan, creditsUsed });

    if (state === "ok") {
      return NextResponse.json({ state, remaining, allowance, emailed: false });
    }

    const providers = await usageThisMonth();
    const monthCost = providers.reduce((total, row) => total + row.costPence, 0);
    const share = allowance > 0 ? Math.round((remaining / allowance) * 100) : 0;

    const subject =
      state === "exhausted"
        ? "Interviewer voice credits have run out"
        : `Interviewer voice credits ${share}% remaining`;

    const lines = [
      `Plan: ${plan} (${allowance.toLocaleString()} credits a month)`,
      `Used this month: ${creditsUsed.toLocaleString()}`,
      `Remaining: ${remaining.toLocaleString()} (${share}%)`,
      "",
      "Running costs so far this month:",
      ...providers.map(
        (row) => `  ${row.provider}: £${(row.costPence / 100).toFixed(2)} over ${row.operations.toLocaleString()} calls`
      ),
      `  Total: £${(monthCost / 100).toFixed(2)}`,
      "",
      state === "exhausted"
        ? "Questions are no longer being read in the chosen voice. Upgrade at elevenlabs.io/app/subscription to restore it."
        : "Upgrade at elevenlabs.io/app/subscription before it runs out.",
    ];

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "AI Career Mentor <noreply@aicareermentor.co.uk>",
      to: process.env.COST_ALERT_EMAIL ?? "support@aicareermentor.co.uk",
      subject,
      text: lines.join("\n"),
    });

    return NextResponse.json({
      state,
      remaining,
      allowance,
      thresholds: { warning: LOW_CREDIT_WARNING, critical: LOW_CREDIT_CRITICAL },
      emailed: true,
    });
  } catch (error) {
    console.error("VOICE CREDITS CRON ERROR:", error);
    return NextResponse.json({ error: "Credit check failed." }, { status: 500 });
  }
}
