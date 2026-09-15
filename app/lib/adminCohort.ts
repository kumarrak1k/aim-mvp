/**
 * Who counts in the admin dashboard's headline numbers.
 *
 * Headline totals and the activation funnel describe real candidates only:
 * team accounts (superadmins and the team's own email addresses) and anyone
 * given complimentary access are left out. The user table still lists
 * everyone, with badges, so nothing is hidden from the admin.
 */

const TEAM_EMAIL_PATTERN = /aicareermentor|kumarrak1k|rak1k/i;

export function isTeamAccount(user: { email: string; role: string | null }): boolean {
  return user.role === "superadmin" || TEAM_EMAIL_PATTERN.test(user.email);
}

/** True while a comp plan is recorded on the account, even once it has expired. */
export function hasHadComplimentaryAccess(meta: {
  compPlan: string | null;
  compUntil: string | null;
}): boolean {
  return Boolean(meta.compPlan);
}

/** Ids of the accounts that count towards headline numbers. */
export function headlineUserIds(
  users: Array<{ id: string; email: string; role: string | null; compPlan: string | null }>
): Set<string> {
  return new Set(
    users
      .filter(
        (u) =>
          !isTeamAccount(u) &&
          !hasHadComplimentaryAccess({ compPlan: u.compPlan, compUntil: null })
      )
      .map((u) => u.id)
  );
}
