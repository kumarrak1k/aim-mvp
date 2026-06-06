/**
 * Demo-data enrichment for MARKETING CAPTURE only (test DB). Runs after the pack
 * auth seed, which creates the personas + a fresh company ("aim-test-co"). This
 * turns that into believable, populated demo data so the corporate dashboard and
 * candidate progress screens look real:
 *   - a rising trend of completed practice sessions for the demo candidate
 *   - a populated "Meridian Talent" company (members, templates, assignments)
 * All fictional. Idempotent in practice: the pack re-seeds a fresh company each
 * run, and candidate sessions are deleted-by-user before re-insert.
 */
import { PrismaClient } from "@prisma/client";
import { createClerkClient } from "@clerk/backend";
import { CANDIDATE_PERSONAS } from "../pack/fixtures/personas";

const prisma = new PrismaClient();
const SLUG = "aim-test-co";
const CANDIDATE_EMAIL = CANDIDATE_PERSONAS.find((p) => p.key === "professional")!.email;

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function candidateClerkId(): Promise<string | null> {
  const sk = process.env.CLERK_SECRET_KEY;
  if (!sk) return null;
  const clerk = createClerkClient({ secretKey: sk });
  const res = await clerk.users.getUserList({ emailAddress: [CANDIDATE_EMAIL] });
  const list = Array.isArray(res) ? res : res.data;
  return list?.[0]?.id ?? null;
}

function summary(score: number, signal: string, cats: Record<string, number>) {
  return {
    overall_score: score,
    readiness_score: score,
    hire_signal: signal,
    category_breakdown: cats,
    top_strengths: ["Clear STAR structure", "Quantified results", "Strong commercial framing"],
    top_improvements: ["Lead with the result", "Tighten the opening line"],
    final_recommendation: "Interview-ready — keep practising delivery under pressure.",
    next_steps: ["Record two voice answers", "Prepare three more STAR stories"],
  };
}

// A believable "getting better over six weeks" arc, ending interview-ready.
const TREND = [
  { d: 38, score: 6, signal: "Moderate", mode: "typed", cats: { content: 6, clarity: 6, relevance: 6, structure: 5, confidence: 6, pace: 6 } },
  { d: 31, score: 6, signal: "Moderate", mode: "voice", cats: { content: 6, clarity: 7, relevance: 6, structure: 6, confidence: 6, pace: 6, voice_delivery: 6 } },
  { d: 24, score: 7, signal: "Moderate", mode: "voice", cats: { content: 7, clarity: 7, relevance: 7, structure: 7, confidence: 7, pace: 7, voice_delivery: 7 } },
  { d: 17, score: 7, signal: "Strong", mode: "voice-camera", cats: { content: 7, clarity: 8, relevance: 7, structure: 7, confidence: 8, pace: 7, voice_delivery: 7, camera_presence: 7 } },
  { d: 9, score: 8, signal: "Strong", mode: "voice-camera", cats: { content: 8, clarity: 8, relevance: 8, structure: 8, confidence: 8, pace: 8, voice_delivery: 8, camera_presence: 8 } },
  { d: 3, score: 9, signal: "Strong", mode: "voice-camera", cats: { content: 9, clarity: 9, relevance: 8, structure: 9, confidence: 9, pace: 8, voice_delivery: 9, camera_presence: 9 } },
];

export async function seedDemoData(): Promise<{ sessions: number; company: string | null }> {
  // ── Candidate progress — a rising trend of completed practice sessions ──
  const cid = await candidateClerkId();
  let sessions = 0;
  if (cid) {
    await prisma.practiceSession.deleteMany({ where: { clerkUserId: cid } });
    for (const t of TREND) {
      await prisma.practiceSession.create({
        data: {
          clerkUserId: cid,
          role: "Product Manager at a fintech scale-up",
          experienceLevel: "Senior / experienced professional",
          interviewType: "Competency / behavioural",
          difficulty: "Standard",
          focusArea: "Balanced",
          practiceMode: t.mode,
          totalQuestions: 5,
          overallScore: t.score,
          hireSignal: t.signal,
          summary: summary(t.score, t.signal, t.cats),
          results: [],
          createdAt: daysAgo(t.d),
        },
      });
      sessions++;
    }
  }

  // ── Corporate dashboard — a populated demo company ──
  const company = await prisma.company.findUnique({ where: { slug: SLUG } });
  if (!company) return { sessions, company: null };

  await prisma.company.update({
    where: { id: company.id },
    data: { name: "Meridian Talent", industry: "Technology", planId: "business", planStatus: "active" },
  });

  for (let i = 1; i <= 3; i++) {
    await prisma.companyMember
      .create({ data: { companyId: company.id, clerkUserId: `demo-recruiter-${i}`, role: "recruiter" } })
      .catch(() => {});
  }

  const templateDefs = [
    { name: "Graduate Software Engineer", role: "Graduate Software Engineer" },
    { name: "Product Manager", role: "Product Manager" },
    { name: "Data Analyst", role: "Data Analyst" },
  ];
  const templates = [];
  for (const t of templateDefs) {
    templates.push(
      await prisma.assessmentTemplate.create({
        data: { companyId: company.id, name: t.name, role: t.role, templateType: "interview", isActive: true },
      }),
    );
  }

  const names = ["alex.morgan", "priya.shah", "tom.baker", "lucy.chen", "sam.okafor", "mia.rossi", "raj.patel", "ella.nguyen", "jack.ward", "nora.haddad", "leo.martin"];
  const statuses = ["completed", "completed", "completed", "completed", "completed", "completed", "completed", "started", "started", "pending", "pending"];
  for (let i = 0; i < names.length; i++) {
    const st = statuses[i];
    await prisma.candidateAssignment.create({
      data: {
        companyId: company.id,
        templateId: templates[i % templates.length].id,
        candidateEmail: `${names[i]}@example.com`,
        status: st,
        expiresAt: daysFromNow(21),
        startedAt: st !== "pending" ? daysAgo(i + 1) : null,
        completedAt: st === "completed" ? daysAgo(i) : null,
      },
    });
  }

  return { sessions, company: "Meridian Talent" };
}
