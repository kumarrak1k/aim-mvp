/**
 * Corporate seeding (Prisma, test DB): a Company + an admin CompanyMember +
 * an assessment-centre AssessmentTemplate, so the corporate dashboard and the
 * (future) assessment-centre specs have something to render.
 *
 * Idempotent: deletes the company by its fixed slug first — onDelete:Cascade
 * removes its members / templates / assignments / invites.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SLUG = "aim-test-co";

// Fixed AC invite token + candidate (the "free" persona) so the assessment-
// centre spec has a ready assignment without depending on the corporate spec.
export const AC_INVITE_TOKEN = "aimtest-ac-invite-token";
export const AC_CANDIDATE_EMAIL = "free+aimtest@aimtest.dev";

export async function seedCompany(adminClerkUserId: string) {
  // AssessmentCentreSession.assignmentToken is @unique and the session is NOT
  // cascade-deleted with the company (the FK points the other way), so a prior
  // run's AC session would collide with this run's start-ac. Drop it first.
  await prisma.assessmentCentreSession.deleteMany({ where: { assignmentToken: AC_INVITE_TOKEN } });
  await prisma.company.deleteMany({ where: { slug: SLUG } });

  const company = await prisma.company.create({
    data: {
      name: "AIM Test Co",
      slug: SLUG,
      planId: "team",
      planStatus: "active",
      trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.companyMember.create({
    data: { companyId: company.id, clerkUserId: adminClerkUserId, role: "admin" },
  });

  const template = await prisma.assessmentTemplate.create({
    data: {
      companyId: company.id,
      name: "Graduate Assessment Centre",
      role: "Graduate Software Engineer",
      templateType: "assessment-centre",
      acStages: ["stage1", "stage2", "stage3"],
      isActive: true,
    },
  });

  await prisma.candidateAssignment.create({
    data: {
      companyId: company.id,
      templateId: template.id,
      candidateEmail: AC_CANDIDATE_EMAIL,
      inviteToken: AC_INVITE_TOKEN,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { companyId: company.id, templateId: template.id };
}

export async function deleteCompany() {
  await prisma.assessmentCentreSession.deleteMany({ where: { assignmentToken: AC_INVITE_TOKEN } });
  await prisma.company.deleteMany({ where: { slug: SLUG } });
}

/** Add N extra recruiter members to the seeded company (for the seat-limit test). */
export async function addCompanyMembers(count: number) {
  const company = await prisma.company.findUnique({ where: { slug: SLUG } });
  if (!company) return;
  for (let i = 0; i < count; i++) {
    await prisma.companyMember.create({
      data: { companyId: company.id, clerkUserId: `seed-member-${i}`, role: "recruiter" },
    });
  }
}

/** Put the seeded company on a trial that has already hit the invite cap. */
export async function setCompanyTrialAtCap() {
  // 10 = CORPORATE_TRIAL_INVITE_CAP in app/lib/corporatePlan.ts
  await prisma.company.updateMany({
    where: { slug: SLUG },
    data: { planStatus: "trial", trialInvitesUsed: 10 },
  });
}
