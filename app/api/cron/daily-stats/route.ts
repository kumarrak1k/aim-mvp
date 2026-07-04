import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface SiteStats {
  newSignups24h: number;
  totalUsers: number;
  sessions24h: number;
  totalSessions: number;
  ac24h: number;
  trialStarts24h: number;
  careerDocs24h: number;
}

async function getComStats(secret: string): Promise<SiteStats | null> {
  try {
    const res = await fetch("https://aicareermentor.com/api/internal/stats", {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function row(label: string, value: string | number) {
  return `
    <tr>
      <td style="padding:6px 0;color:#9ca3af;font-size:13px;">${label}</td>
      <td style="padding:6px 0;color:#f9fafb;font-size:13px;font-weight:700;text-align:right;">${value}</td>
    </tr>`;
}

function siteBlock(title: string, domain: string, s: SiteStats) {
  return `
  <div style="background:#111827;border:1px solid #374151;border-radius:12px;padding:20px;margin-bottom:16px;">
    <p style="margin:0 0 12px;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#a78bfa;">${title}</p>
    <p style="margin:0 0 12px;font-size:12px;color:#6b7280;">${domain}</p>
    <table style="width:100%;border-collapse:collapse;">
      ${row("New signups (24h)", s.newSignups24h)}
      ${row("Total users", s.totalUsers.toLocaleString())}
      ${row("Practice sessions (24h)", s.sessions24h)}
      ${row("Total sessions", s.totalSessions.toLocaleString())}
      ${row("Assessment centres (24h)", s.ac24h)}
      ${row("Corporate trials started (24h)", s.trialStarts24h)}
      ${row("Career docs (24h)", s.careerDocs24h)}
    </table>
  </div>`;
}

function buildEmail(
  ukStats: SiteStats,
  comStats: SiteStats | null,
  dateStr: string
): string {
  const combinedSignups =
    ukStats.newSignups24h + (comStats?.newSignups24h ?? 0);
  const combinedUsers = ukStats.totalUsers + (comStats?.totalUsers ?? 0);
  const combinedSessions = ukStats.sessions24h + (comStats?.sessions24h ?? 0);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0614;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">

    <div style="margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:900;letter-spacing:0.18em;text-transform:uppercase;color:#a78bfa;">AI Career Mentor</p>
      <h1 style="margin:0;font-size:22px;font-weight:900;color:#f9fafb;">Daily Stats — ${dateStr}</h1>
    </div>

    ${siteBlock("aicareermentor.co.uk", "United Kingdom", ukStats)}
    ${comStats ? siteBlock("aicareermentor.com", "International", comStats) : `
    <div style="background:#111827;border:1px solid #374151;border-radius:12px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:#6b7280;">⚠️ .com stats unavailable — check /api/internal/stats</p>
    </div>`}

    ${comStats ? `
    <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#34d399;">Combined totals</p>
      <table style="width:100%;border-collapse:collapse;">
        ${row("New signups (24h)", combinedSignups)}
        ${row("Total users", combinedUsers.toLocaleString())}
        ${row("Sessions (24h)", combinedSessions)}
      </table>
    </div>` : ""}

    <p style="margin:0;font-size:11px;color:#4b5563;text-align:center;">
      Sent by AI Career Mentor cron · <a href="https://vercel.com" style="color:#6b7280;">Vercel</a>
    </p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sinceMs = since.getTime();

  const [
    allUsersResp,
    sessions24h,
    totalSessions,
    ac24h,
    trialStarts24h,
    careerDocs24h,
    comStats,
  ] = await Promise.all([
    (await clerkClient()).users.getUserList({ limit: 500, orderBy: "-created_at" }),
    prisma.practiceSession.count({ where: { createdAt: { gte: since } } }),
    prisma.practiceSession.count(),
    prisma.assessmentCentreSession.count({
      where: { createdAt: { gte: since }, status: "complete" },
    }),
    prisma.company.count({
      where: { trialStartedAt: { gte: since } },
    }),
    prisma.careerDocGeneration.count({ where: { createdAt: { gte: since } } }),
    getComStats(secret),
  ]);

  const ukStats: SiteStats = {
    newSignups24h: allUsersResp.data.filter((u) => u.createdAt > sinceMs).length,
    totalUsers: allUsersResp.totalCount,
    sessions24h,
    totalSessions,
    ac24h,
    trialStarts24h,
    careerDocs24h,
  };

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "AI Career Mentor <noreply@aicareermentor.co.uk>",
    to: "rakesh@aicareermentor.co.uk",
    subject: `📊 Daily Stats — ${dateStr}`,
    html: buildEmail(ukStats, comStats, dateStr),
  });

  return NextResponse.json({
    ok: true,
    uk: ukStats,
    com: comStats ?? "unavailable",
  });
}
