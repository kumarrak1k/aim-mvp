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
  return (
    process.env.EMAIL_FROM ||
    `AI Career Mentor <noreply@${siteConfig.domain}>`
  );
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
            &copy; ${new Date().getFullYear()} AI Career Mentor Ltd
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

type NurtureType = "welcome" | "day3_tip" | "day7_progress";

const NURTURE_SUBJECTS: Record<NurtureType, string> = {
  welcome:       "Welcome to AI Career Mentor — your first interview tip",
  day3_tip:      "One interview tip that changes everything",
  day7_progress: "One week in — ready for your next practice session?",
};

function renderNurtureHtml(type: NurtureType): string {
  const year = new Date().getFullYear();
  const practiceUrl = `${siteConfig.url}/practice`;
  const starUrl     = `${siteConfig.url}/tools/star-scorer`;
  const unsubUrl    = `${siteConfig.url}/profile`;

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

    day3_tip: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        The question most candidates get wrong.
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        "What's your greatest weakness?" is still one of the most common
        interview questions — and still one of the most mishandled.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          What good looks like
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          Name a <strong>genuine weakness</strong>, show what you've
          <strong>done about it</strong>, and be specific about
          <strong>the progress you've made</strong>. Saying "I'm a
          perfectionist" is the answer that gets you screened out.
        </p>
      </div>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#2a2238;">
        Run a practice session and AI Career Mentor will give you this
        question — then score your answer and suggest exactly how to
        improve it.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Practice now →
          </a>
        </td></tr>
      </table>`,

    day7_progress: `
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a1426;">
        One week in — how's the prep going?
      </h2>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2a2238;">
        Consistent practice is what separates candidates who perform well
        from those who freeze up. Even 20 minutes a day makes a significant
        difference over two weeks.
      </p>
      <div style="background:#f7f5fb;border-left:3px solid #8c5cff;border-radius:0 12px 12px 0;padding:18px 22px;margin:0 0 24px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#7c6a99;">
          Try the free STAR scorer
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#2a2238;">
          Have a specific answer you're working on? Paste it into the free
          STAR scorer — no session needed — and get instant feedback on
          your Situation, Task, Action, and Result.
        </p>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr><td style="border-radius:12px;background:#8c5cff;">
          <a href="${practiceUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:800;text-decoration:none;">
            Run a practice session →
          </a>
        </td></tr>
      </table>
      <p style="margin:0 0 28px;">
        <a href="${starUrl}" style="font-size:14px;color:#8c5cff;text-decoration:none;font-weight:700;">
          Or try the free STAR scorer →
        </a>
      </p>`,
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
            You're receiving this because you signed up to AI Career Mentor.
            <a href="${unsubUrl}" style="color:#7c6a99;">Manage email preferences</a>.<br/>
            &copy; ${year} AI Career Mentor Ltd &middot; England &amp; Wales
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
  const texts: Record<NurtureType, string> = {
    welcome: `Welcome to AI Career Mentor!\n\nTip #1 — The STAR method.\nEvery behavioural interview question is best answered with Situation → Task → Action → Result.\n\nRun your first practice session: ${practiceUrl}`,
    day3_tip: `The weakness question — what good looks like.\n\nName a genuine weakness, show what you've done about it, and be specific about the progress you've made.\n\nPractice now: ${practiceUrl}`,
    day7_progress: `One week in — keep going.\n\nConsistent practice is what separates candidates who perform well from those who freeze up.\n\nRun a session: ${practiceUrl}`,
  };
  return texts[type] + `\n\n— AI Career Mentor\n${siteConfig.url}`;
}

export async function sendNurtureEmail(
  to: string,
  type: NurtureType
): Promise<SendResult> {
  const client = getResendClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY missing" };

  try {
    const result = await client.emails.send({
      from: getFromAddress(),
      to,
      subject: NURTURE_SUBJECTS[type],
      html: renderNurtureHtml(type),
      text: renderNurturePlainText(type),
      tags: [{ name: "category", value: "nurture" }],
    });

    if (result.error) return { ok: false, error: result.error.message };
    if (!result.data?.id) return { ok: false, error: "No message id returned" };
    return { ok: true, id: result.data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
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
