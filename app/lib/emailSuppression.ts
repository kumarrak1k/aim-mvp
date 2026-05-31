import { prisma } from "./prisma";

/** Add an address to the never-send list (hard bounce / spam complaint). */
export async function suppressEmail(
  email: string,
  reason: "bounced" | "complained"
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  await prisma.suppressedEmail.upsert({
    where: { email: normalized },
    create: { email: normalized, reason },
    update: { reason },
  });
}

/** True if the address has hard-bounced or complained — don't send to it. */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  const row = await prisma.suppressedEmail.findUnique({
    where: { email: normalized },
  });
  return Boolean(row);
}
