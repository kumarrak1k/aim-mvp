/**
 * Outbound transactional email — currently for candidate assessment invites.
 *
 * Provider: Resend (https://resend.com).
 * Required env vars (set in Vercel → Project → Settings → Environment Variables):
 *   - RESEND_API_KEY  — secret, starts with "re_"
 *   - EMAIL_FROM      — display address, e.g. "AI Career Mentor <noreply@aicareermentor.co.uk>"
 *
 * Calls are non-blocking from the recruiter's point of view: if the send
 * fails (e.g. transient Resend outage) we log and return a structured result
 * so the API route can decide whether to fail the whole request or just
 * surface a "couldn't email yet, but invite is created" warning.
 */

import { Resend } from "resend";
import { siteConfig } from "../config/site";

type SendCandidateInviteParams = {
  to: string;
  companyName: string;
  companyBrandColor?: string;
  templateName: string;
  roleTitle: string;
  inviteToken: string;
  expiresAt: Date;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Lazily build the Resend client so a missing key doesn't crash module load
 *  (e.g. in CI where env vars may not be set). */
function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress(): string {
  const configured = process.env.EMAIL_FROM;
  // Always show "AI Career Mentor" as the sender display name.
  // Accept EMAIL_FROM as either a plain address ("noreply@aicareermentor.co.uk")
  // or a full RFC address ("Anything <noreply@aicareermentor.co.uk>"). In the
  // latter case we extract only the address part and override the display name,
  // so a misconfigured env var display name never leaks through.
  const bracketMatch = configured?.match(/<([^>]+)>/);
  const plainMatch = configured?.match(/^([^\s<>]+@[^\s<>]+)$/);
  const address = bracketMatch?.[1] ?? plainMatch?.[1] ?? `noreply@${siteConfig.domain}`;
  return `AI Career Mentor <${address}>`;
}

function formatExpiry(expiresAt: Date): string {
  return expiresAt.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

/** Escape user-provided strings before they go into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInviteUrl(token: string): string {
  return `${siteConfig.url}/assessment/${encodeURIComponent(token)}`;
}

function renderHtml({
  companyName,
  companyBrandColor,
  templateName,
  roleTitle,
  inviteUrl,
  expiresAtPretty,
}: {
  companyName: string;
  companyBrandColor: string;
  templateName: string;
  roleTitle: string;
  inviteUrl: string;
  expiresAtPretty: string;
}): string {
  // Inline CSS only — many email clients strip <style> blocks.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Your interview assessment from ${escapeHtml(companyName)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f3f8;font-family:Arial,Helvetica,sans-serif;color:#1a1426;">
  <div style="display:none;max-height:0;overflow:hidden;">
    ${escapeHtml(companyName)} has invited you to complete an AI interview assessment for ${escapeHtml(roleTitle)}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f8;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 30px rgba(20,10,40,0.08);">

        <tr><td style="background:${companyBrandColor};padding:32px 36px;">
          <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
            ${escapeHtml(companyName)}
          </p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;line-height:1.2;font-weight:800;">
            You&rsquo;ve been invited to take an interview assessment.
          </h1>
        </td></tr>

        <tr><td style="padding:36px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2a2238;">
            Hi,
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2a2238;">
            ${escapeHtml(companyName)} has invited you to complete an AI-powered
            interview assessment as part of their hiring process for the
            <strong>${escapeHtml(roleTitle)}</strong> role.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#2a2238;">
            This is a tailored interview that takes about 15&ndash;25 minutes.
            You&rsquo;ll answer a small number of questions out loud or in writing,
            and your responses will be reviewed by ${escapeHtml(companyName)}&rsquo;s hiring team.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5fb;border-radius:12px;padding:20px 22px;margin:0 0 24px;">
            <tr><td>
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
                Assessment
              </p>
              <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#1a1426;">
                ${escapeHtml(templateName)}
              </p>
              <p style="margin:0;font-size:13px;color:#5a4f73;">
                Invite expires on <strong>${escapeHtml(expiresAtPretty)}</strong>.
              </p>
            </td></tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr><td style="border-radius:12px;background:${companyBrandColor};">
              <a href="${inviteUrl}"
                 style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;border-radius:12px;">
                Take the assessment &rarr;
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#5a4f73;">
            If the button doesn&rsquo;t work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#3a2f54;">
            <a href="${inviteUrl}" style="color:#3a2f54;">${inviteUrl}</a>
          </p>

          <hr style="border:none;border-top:1px solid #e7e3ee;margin:24px 0;" />

          <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#7c6a99;">
            This invite was sent on behalf of ${escapeHtml(companyName)} via
            AI Career Mentor &mdash; an interview practice platform.
            If you weren&rsquo;t expecting it, you can safely ignore this email.
          </p>
          <p style="margin:0;font-size:12px;line-height:1.6;color:#7c6a99;">
            &copy; ${new Date().getFullYear()} AI Career Mentor &middot; England &amp; Wales
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderPlainText({
  companyName,
  templateName,
  roleTitle,
  inviteUrl,
  expiresAtPretty,
}: {
  companyName: string;
  templateName: string;
  roleTitle: string;
  inviteUrl: string;
  expiresAtPretty: string;
}): string {
  return [
    `${companyName} has invited you to complete an interview assessment.`,
    ``,
    `Role: ${roleTitle}`,
    `Assessment: ${templateName}`,
    `Invite expires: ${expiresAtPretty}`,
    ``,
    `Take the assessment:`,
    inviteUrl,
    ``,
    `This is a tailored interview that takes about 15-25 minutes.`,
    `You'll answer a small number of questions out loud or in writing,`,
    `and your responses will be reviewed by ${companyName}'s hiring team.`,
    ``,
    `If you weren't expecting this email, you can safely ignore it.`,
    ``,
    `— AI Career Mentor (sent on behalf of ${companyName})`,
  ].join("\n");
}

// ── Nurture emails ────────────────────────────────────────────────────────────

export type NurtureType =
  | "welcome"
  | "day2_tip"
  | "day4_social"
  | "day7_upgrade"
  | "day14_reengage"
  | "day21_nudge"
  | "day30_winback"
  | "trial_midway"
  | "trial_ended";

/**
 * Trial-status notices are service notifications about a material change to the
 * user's account access, so they bypass the marketing-consent suppression.
 * (trial_midway is a value nudge and is treated as marketing.)
 */
export const TRANSACTIONAL_NURTURE_TYPES: ReadonlySet<NurtureType> = new Set([
  "trial_ended",
]);

const NURTURE_SUBJECTS: Record<NurtureType, string> = {
  welcome:        "Welcome to AI Career Mentor — your first interview tip",
  day2_tip:       "Most candidates never practise this (but should)",
  day4_social:    "How one user went from nervous to offer in 2 weeks",
  day7_upgrade:   "Unlock unlimited practice sessions — limited offer",
  day14_reengage: "Got an interview coming up?",
  day21_nudge:    "Still here — want to run a quick session?",
  day30_winback:  "Last chance — your free practice sessions are waiting",
  trial_midway:   "A few days left on your Professional trial",
  trial_ended:    "Your free trial has ended",
};

function renderNurtureHtml(type: NurtureType, unsubUrl: string): string {
  const year = new Date().getFullYear();
  const practiceUrl = `${siteConfig.url}/practice`;
  const starUrl     = `${siteConfig.url}/tools/star-scorer`;

  const upgradeUrl = `${siteConfig.url}/for-candidates/pricing`;
  const referUrl   = `${siteConfig.url}/refer`;

  const bodies: Record<NurtureType, string> = {
    welcome: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        Welcome — let's get you interview-ready.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        You're now set up on AI Career Mentor. Here's the single most
        important thing to practise first:
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          Tip #1 — The STAR method
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          Every behavioural interview question is best answered with
          <strong>Situation → Task → Action → Result</strong>.
          Structure your answer this way and you'll immediately sound
          more credible and organised than most candidates.
        </p>
      </div>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        Run your first practice session now — pick your role, choose an
        interview type, and AI Career Mentor will generate tailored questions
        and score your answers in real time.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Start your first session →
          </a>
        </td></tr>
      </table>`,

    day2_tip: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        The delivery habit most candidates never practise.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        Your answer content can be perfect — and you can still lose the offer
        because of <em>how</em> you say it. Voice delivery is the hidden
        differentiator at every level.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          Three things to fix today
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          <strong>1. Pace</strong> — slow down by 20%. Most candidates rush.<br/>
          <strong>2. Filler words</strong> — count your "ums" and "so yeahs". One session will tell you.<br/>
          <strong>3. Endings</strong> — finish sentences firmly, don't trail off with rising intonation.
        </p>
      </div>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        AI Career Mentor scores your voice delivery in every session —
        pace, filler words, and confidence signal. Run a session to see yours.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Run a session and check your delivery →
          </a>
        </td></tr>
      </table>`,

    day4_social: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        From nervous to offer in two weeks.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        Here's what consistent practice looks like when it works:
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#2a2238;font-style:italic;">
          "I'd failed two final-round interviews in a row. I practised every
          evening for 10 days — each session showed me exactly where I was
          losing marks. The third final round, I got the offer."
        </p>
        <p style="margin:0;font-size:13px;color:#7c6a99;font-weight:700;">
          — Graduate candidate, Financial Services
        </p>
      </div>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        The difference isn't talent — it's having honest, specific feedback
        on every answer, every session. That's what AI Career Mentor gives you.
      </p>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        And if you know someone else who's preparing — share your referral link
        and they get a head start too.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Continue practising →
          </a>
        </td></tr>
      </table>
      <p style="margin:0 0 28px;">
        <a href="${referUrl}" style="font-size:14px;color:#8c5cff;text-decoration:none;font-weight:700;">
          Share your referral link →
        </a>
      </p>`,

    day7_upgrade: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        Unlock unlimited sessions — special offer for new users.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        You've been on the platform for a week. If you've run even one session,
        you've seen how targeted the feedback is. Now imagine running one every day
        until your interview.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          Plus plan — from £14.08/month
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          Unlimited AI mock interviews · Voice &amp; camera delivery coaching ·
          Interview Readiness Certificate · Priority support
        </p>
      </div>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        One interview offer is worth far more than a month's subscription.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${upgradeUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            See pricing →
          </a>
        </td></tr>
      </table>`,

    day14_reengage: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        Got an interview coming up?
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        Two weeks in — if you've got an interview on the horizon, now is the
        time to shift into serious prep mode.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          10-day interview sprint
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          Days 1–3: Competency questions for your target role.<br/>
          Days 4–6: Strength &amp; motivation questions.<br/>
          Days 7–9: Case study or technical, depending on your interview type.<br/>
          Day 10: Full mock with camera and voice coaching on.
        </p>
      </div>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        AI Career Mentor handles all of this — just set your role and start.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Start your 10-day sprint →
          </a>
        </td></tr>
      </table>`,

    day21_nudge: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        Still here — one quick session?
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        Three weeks since you signed up. Whether you've been practising daily or
        haven't started yet, one session today will move you forward.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          Takes 15 minutes
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          Pick your role. Answer 5 questions. Get scored on content, voice, and
          delivery. Walk away knowing exactly what to improve.
        </p>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Run a 15-minute session →
          </a>
        </td></tr>
      </table>
      <p style="margin:0 0 28px;">
        <a href="${starUrl}" style="font-size:14px;color:#8c5cff;text-decoration:none;font-weight:700;">
          Or score a specific answer with the free STAR tool →
        </a>
      </p>`,

    day30_winback: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        Your practice sessions are still here.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        It's been 30 days. Whenever your next interview comes up —
        whether that's tomorrow or in three months — AI Career Mentor
        will be ready for you.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          Free to use, any time
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          No subscription needed to start. Log in, pick your role,
          and run a session — your account and progress are all saved.
        </p>
      </div>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        When you're ready to go unlimited, the Plus plan is £14.08/month.
        But there's no pressure — come back whenever you need us.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Return to AI Career Mentor →
          </a>
        </td></tr>
      </table>`,

    trial_midway: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        A few days left on your Professional trial.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        You're partway through your 7-day full-access trial — make the most of
        everything that unlocks before it ends:
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          <strong>Voice &amp; camera coaching</strong> — see your delivery scored.<br/>
          <strong>Mock assessment centre</strong> — case study, interview &amp; presentation.<br/>
          <strong>Career docs</strong> — CV enhancer, personal statement &amp; cover letter.
        </p>
      </div>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        When the trial ends you'll move to the Free plan. Upgrade any time to keep
        full access — no card needed until you decide.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Jump back in →
          </a>
        </td></tr>
      </table>
      <p style="margin:0 0 28px;">
        <a href="${upgradeUrl}" style="font-size:14px;color:#8c5cff;text-decoration:none;font-weight:700;">
          Keep full access — see plans →
        </a>
      </p>`,

    trial_ended: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        Your free trial has ended.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        Your 7-day Professional trial is now over and your account has moved to
        the <strong>Free plan</strong> — that's 3 keyboard-only practice sessions.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          Upgrade to keep <strong>unlimited practice</strong>, voice &amp; camera
          coaching, mock assessment centres and career docs.
        </p>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${upgradeUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            See plans &amp; upgrade →
          </a>
        </td></tr>
      </table>`,
  };

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f3f8;font-family:Arial,Helvetica,sans-serif;color:#1a1426;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f8;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 30px rgba(20,10,40,0.08);">
        <tr><td style="background:#8c5cff;padding:28px 36px;">
          <p style="margin:0;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">
            AI Career Mentor
          </p>
        </td></tr>
        <tr><td style="padding:36px;">
          ${bodies[type]}
          <hr style="border:none;border-top:1px solid #e7e3ee;margin:32px 0 20px;" />
          <p style="margin:0;font-size:12px;line-height:1.6;color:#7c6a99;">
            You're receiving this because you have an AI Career Mentor account.
            <a href="${unsubUrl}" style="color:#7c6a99;">Unsubscribe</a> &middot;
            <a href="${siteConfig.url}/account/notifications" style="color:#7c6a99;">manage email preferences</a>.<br/>
            &copy; ${year} AI Career Mentor &middot; England &amp; Wales
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderNurturePlainText(type: NurtureType): string {
  const practiceUrl = `${siteConfig.url}/practice`;
  const upgradeUrl = `${siteConfig.url}/for-candidates/pricing`;
  const referUrl   = `${siteConfig.url}/refer`;
  const texts: Record<NurtureType, string> = {
    welcome:        `Welcome to AI Career Mentor!\n\nTip #1 — The STAR method.\nEvery behavioural question is best answered with Situation → Task → Action → Result.\n\nRun your first session: ${practiceUrl}`,
    day2_tip:       `Most candidates never practise voice delivery — but it's scored in every session.\n\nFix: slow down, cut filler words, finish sentences firmly.\n\nRun a session and check your delivery: ${practiceUrl}`,
    day4_social:    `From nervous to offer in two weeks — real story from a Financial Services graduate.\n\nConsistent, specific feedback makes the difference.\n\nContinue practising: ${practiceUrl}\nShare your referral link: ${referUrl}`,
    day7_upgrade:   `One week in. Unlock unlimited sessions and interview as many times as you need.\n\nPlus plan from £14.08/month — see pricing: ${upgradeUrl}`,
    day14_reengage: `Got an interview coming up? Run a 10-day sprint: competency, strength, and motivation questions, then a full mock on day 10.\n\nStart here: ${practiceUrl}`,
    day21_nudge:    `Still here — one 15-minute session will move you forward. Pick your role, answer 5 questions, get scored.\n\n${practiceUrl}`,
    day30_winback:  `Your practice sessions are still here. Come back whenever you're ready.\n\n${practiceUrl}`,
    trial_midway:   `A few days left on your Professional trial. Make the most of voice & camera coaching, the mock assessment centre, and career docs before it ends.\n\nJump back in: ${practiceUrl}\nKeep full access: ${upgradeUrl}`,
    trial_ended:    `Your 7-day Professional trial has ended — your account is now on the Free plan (3 keyboard-only sessions).\n\nUpgrade to keep unlimited practice, voice & camera coaching and assessment centres: ${upgradeUrl}`,
  };
  return texts[type] + `\n\n— AI Career Mentor\n${siteConfig.url}`;
}

export async function sendNurtureEmail(
  to: string,
  type: NurtureType,
  opts?: { unsubscribeToken?: string }
): Promise<SendResult> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY missing" };

  // The List-Unsubscribe link points at the API route (GET redirects a human
  // to the confirmation page; POST is the RFC 8058 one-click path).
  const unsubUrl = opts?.unsubscribeToken
    ? `${siteConfig.url}/api/email/unsubscribe/${opts.unsubscribeToken}`
    : `${siteConfig.url}/account/notifications`;

  const headers: Record<string, string> = {};
  if (opts?.unsubscribeToken) {
    headers["List-Unsubscribe"] = `<${unsubUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const result = await client.emails.send({
      from: getFromAddress(),
      to,
      subject: NURTURE_SUBJECTS[type],
      html: renderNurtureHtml(type, unsubUrl),
      text: renderNurturePlainText(type),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      tags: [
        {
          name: "category",
          value: TRANSACTIONAL_NURTURE_TYPES.has(type) ? "trial-status" : "nurture",
        },
      ],
    });

    if (result.error) return { ok: false, error: result.error.message };
    if (!result.data?.id) return { ok: false, error: "No message id returned" };
    return { ok: true, id: result.data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

// ── Admin welcome email ───────────────────────────────────────────────────────

type SendAdminWelcomeParams = {
  to: string;
  firstName?: string | null;
  signInUrl: string;
};

function renderAdminWelcomeHtml({ to, firstName, signInUrl }: SendAdminWelcomeParams): string {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f3f8;font-family:Arial,Helvetica,sans-serif;color:#1a1426;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f8;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 30px rgba(20,10,40,0.08);">

        <tr><td style="background:linear-gradient(135deg,#6d28d9,#a21caf);padding:32px 36px;">
          <p style="margin:0;color:#e9d5ff;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;">
            AI Career Mentor
          </p>
          <h1 style="margin:10px 0 0;color:#ffffff;font-size:24px;line-height:1.25;font-weight:800;">
            Your account is ready.
          </h1>
        </td></tr>

        <tr><td style="padding:36px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
            An account has been created for you on AI Career Mentor —
            an AI-powered platform for interview practice and assessment preparation.
          </p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
            Click the button below to sign in. You'll be asked to set a
            personal password before you can access your account.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr><td style="border-radius:12px;background:#7c3aed;">
              <a href="${escapeHtml(signInUrl)}"
                 style="display:inline-block;padding:15px 32px;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;border-radius:12px;">
                Sign in and set your password &rarr;
              </a>
            </td></tr>
          </table>

          <div style="background:#f7f5fb;border-radius:12px;padding:16px 20px;margin:0 0 28px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#7c6a99;">
              Sign in as
            </p>
            <p style="margin:0;font-size:14px;color:#3a2f54;font-weight:600;">${escapeHtml(to)}</p>
          </div>

          <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#7c6a99;">
            If the button doesn&rsquo;t work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 28px;font-size:12px;word-break:break-all;">
            <a href="${escapeHtml(signInUrl)}" style="color:#6d28d9;">${escapeHtml(signInUrl)}</a>
          </p>

          <hr style="border:none;border-top:1px solid #e7e3ee;margin:0 0 20px;" />

          <p style="margin:0;font-size:12px;line-height:1.7;color:#7c6a99;">
            This link works once and expires in 7 days. If you weren&rsquo;t
            expecting this email, please ignore it &mdash; no action is needed.<br/>
            &copy; ${year} AI Career Mentor &middot; England &amp; Wales
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderAdminWelcomePlainText({ to, firstName, signInUrl }: SendAdminWelcomeParams): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";
  return [
    greeting,
    "",
    "An account has been created for you on AI Career Mentor.",
    "",
    "Sign in and set your password using the link below:",
    signInUrl,
    "",
    `Account email: ${to}`,
    "",
    "This link works once and expires in 7 days.",
    "If you weren't expecting this email, you can safely ignore it.",
    "",
    "— AI Career Mentor",
    siteConfig.url,
  ].join("\n");
}

export async function sendAdminWelcomeEmail(
  params: SendAdminWelcomeParams
): Promise<SendResult> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };

  try {
    const result = await client.emails.send({
      from: getFromAddress(),
      to: params.to,
      subject: "Your AI Career Mentor account is ready",
      html: renderAdminWelcomeHtml(params),
      text: renderAdminWelcomePlainText(params),
      tags: [{ name: "category", value: "admin-welcome" }],
    });

    if (result.error) return { ok: false, error: result.error.message };
    if (!result.data?.id) return { ok: false, error: "No message id returned." };
    return { ok: true, id: result.data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function sendCandidateInvite(
  params: SendCandidateInviteParams
): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)." };
  }

  const inviteUrl = buildInviteUrl(params.inviteToken);
  const expiresAtPretty = formatExpiry(params.expiresAt);
  const brandColor =
    params.companyBrandColor && /^#[0-9a-fA-F]{6}$/.test(params.companyBrandColor)
      ? params.companyBrandColor
      : "#8c5cff";

  try {
    const result = await client.emails.send({
      from: getFromAddress(),
      to: params.to,
      subject: `Your interview assessment from ${params.companyName}`,
      html: renderHtml({
        companyName: params.companyName,
        companyBrandColor: brandColor,
        templateName: params.templateName,
        roleTitle: params.roleTitle,
        inviteUrl,
        expiresAtPretty,
      }),
      text: renderPlainText({
        companyName: params.companyName,
        templateName: params.templateName,
        roleTitle: params.roleTitle,
        inviteUrl,
        expiresAtPretty,
      }),
      headers: {
        // Helps inboxes thread re-sends together if the recruiter resends.
        "X-Entity-Ref-ID": params.inviteToken,
      },
      tags: [{ name: "category", value: "candidate-invite" }],
    });

    if (result.error) {
      return { ok: false, error: result.error.message || "Resend rejected the request." };
    }

    if (!result.data?.id) {
      return { ok: false, error: "Resend returned no message id." };
    }

    return { ok: true, id: result.data.id };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    return { ok: false, error: `Email send failed: ${detail}` };
  }
}
