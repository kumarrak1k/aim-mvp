/**
 * Admin IP-allowlist bypass.
 *
 * ADMIN_ALLOWED_IPS is defence-in-depth in front of the admin area, but a
 * home/office IP changes without warning and middleware env vars are baked at
 * build time — so arming the allowlist normally means a redeploy is the only
 * way back in after an ISP reassignment. That risk is why it was never armed.
 *
 * This makes arming it safe. Redeeming /admin/unlock?key=<ADMIN_BYPASS_SECRET>
 * once per device sets a signed, httpOnly cookie that satisfies the IP gate for
 * BYPASS_DAYS, from any network, with no redeploy.
 *
 * The cookie carries an expiry plus an HMAC of that expiry, so it cannot be
 * forged or extended client-side, and it is never the raw secret — a stolen
 * cookie expires on its own and can be revoked by rotating the secret.
 *
 * This is NOT the authentication boundary. Clerk auth plus the superadmin role
 * check still gate every admin page; the allowlist and this bypass sit in front
 * of them as a second layer.
 *
 * Edge-runtime safe: Web Crypto only, no Node built-ins.
 */

export const ADMIN_BYPASS_COOKIE = "aim-admin-bypass";

/** How long a redeemed unlock link keeps a device authorised. */
export const BYPASS_DAYS = 30;

const encoder = new TextEncoder();

/** Constant-time string compare — avoids leaking the secret via response timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build the cookie value for a device that just redeemed a valid unlock link. */
export async function createBypassToken(
  secret: string,
  expiresAtMs: number
): Promise<string> {
  const exp = String(expiresAtMs);
  return `${exp}.${await hmacHex(secret, exp)}`;
}

/**
 * Validate a bypass cookie. Returns false for anything malformed, expired, or
 * not signed by the current secret — so rotating ADMIN_BYPASS_SECRET revokes
 * every outstanding device at once.
 */
export async function isValidBypassToken(
  secret: string,
  token: string | undefined | null
): Promise<boolean> {
  if (!secret || !token) return false;

  const sep = token.indexOf(".");
  if (sep <= 0) return false;

  const exp = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  if (!exp || !sig) return false;

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  return timingSafeEqual(sig, await hmacHex(secret, exp));
}
