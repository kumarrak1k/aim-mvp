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
