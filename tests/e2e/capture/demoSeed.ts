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

/**
 * Which score arc to seed. `DEMO_ARC=short` gives a three-session arc for the
 * marketing shot of the readiness trend; anything else gives the default
 * six-week arc used for the site screenshots.
 *
 * Both are fictional demo data on the test database. If a number from either
 * arc is ever shown as a headline rather than as UI furniture, it becomes a
 * claim about typical results and needs evidence behind it.
 */
const ARC = process.env.DEMO_ARC ?? "default";

// A deliberately steep three-session arc, for a shot that has to read at a
// glance. Fewer points and a wider spread than the default.
const SHORT_TREND = [
  { d: 21, score: 4, signal: "Developing", mode: "typed", cats: { content: 4, clarity: 4, relevance: 5, structure: 3, confidence: 4, pace: 4 } },
  { d: 12, score: 5, signal: "Moderate", mode: "voice", cats: { content: 5, clarity: 6, relevance: 5, structure: 5, confidence: 5, pace: 5, voice_delivery: 5 } },
  { d: 2, score: 8, signal: "Strong", mode: "voice-camera", cats: { content: 8, clarity: 8, relevance: 8, structure: 8, confidence: 8, pace: 8, voice_delivery: 8, camera_presence: 8 } },
];

// A believable "getting better over six weeks" arc, ending interview-ready.
const DEFAULT_TREND = [
  { d: 38, score: 6, signal: "Moderate", mode: "typed", cats: { content: 6, clarity: 6, relevance: 6, structure: 5, confidence: 6, pace: 6 } },
  { d: 31, score: 6, signal: "Moderate", mode: "voice", cats: { content: 6, clarity: 7, relevance: 6, structure: 6, confidence: 6, pace: 6, voice_delivery: 6 } },
  { d: 24, score: 7, signal: "Moderate", mode: "voice", cats: { content: 7, clarity: 7, relevance: 7, structure: 7, confidence: 7, pace: 7, voice_delivery: 7 } },
  { d: 17, score: 7, signal: "Strong", mode: "voice-camera", cats: { content: 7, clarity: 8, relevance: 7, structure: 7, confidence: 8, pace: 7, voice_delivery: 7, camera_presence: 7 } },
  { d: 9, score: 8, signal: "Strong", mode: "voice-camera", cats: { content: 8, clarity: 8, relevance: 8, structure: 8, confidence: 8, pace: 8, voice_delivery: 8, camera_presence: 8 } },
  { d: 3, score: 9, signal: "Strong", mode: "voice-camera", cats: { content: 9, clarity: 9, relevance: 8, structure: 9, confidence: 9, pace: 8, voice_delivery: 9, camera_presence: 9 } },
];

const TREND = ARC === "short" ? SHORT_TREND : DEFAULT_TREND;
console.log(`demo arc [${ARC}] → ${TREND.length} sessions, scores ${TREND.map((t) => t.score).join(" → ")}`);

// A full per-candidate result (summary + per-question feedback + voice/camera),
// so /company/results and /company/results/[id] render with real, scored content.
function candidateSession(clerkUserId: string, role: string, score: number, signal: string) {
  const c = Math.max(1, Math.min(10, score));
  const lo = Math.max(1, c - 1);
  const cats = { content: c, clarity: c, relevance: c, structure: lo, confidence: c, pace: lo, voice_delivery: c, camera_presence: c };
  const q = (question: string, answer: string) => ({
    question,
    answer,
    feedback: {
      overall_score: c,
      category_scores: { content: c, clarity: c, relevance: c, structure: lo, confidence: c },
      strengths: ["Clear STAR structure", "Specific, quantified result"],
      improvements: ["Lead with the outcome", "Tighten the opening line"],
      improved_answer: "Situation/Task: I owned X under a tight deadline. Action: I did Y. Result: it delivered Z — a measurable, role-relevant outcome.",
      // The session page renders improved_answer_star and only falls back to
      // the flat improved_answer if it is absent. Without this the "Model
      // answer (STAR)" panel never appears on a seeded session, which is the
      // single most persuasive screen the product has.
      improved_answer_star: {
        situation:
          "In my final-year project our weekly reports took two days to produce, and the delay was holding up decisions.",
        task: "I was asked to cut the turnaround without adding headcount.",
        action:
          "I redesigned the data pipeline, automated the validation checks, and documented the new process so the whole team could run it.",
        result:
          "Turnaround fell by 40% and the approach was adopted across the team, which showed I can deliver a measurable process improvement.",
      },
    },
    voiceAnalysis: {
      overallVoiceScore: c, paceScore: c, fillerScore: lo, confidenceScore: c, energyScore: c,
      metrics: { estimatedWPM: 148, fillerCount: 4, longPauseCount: 1, wordCount: 182 },
      feedback: { strengths: ["Measured, confident pace"], improvements: ["Trim filler words"] },
    },
    videoAnalysis: {
      overallVideoScore: c, eyeContactScore: c, positionScore: c, bodyLanguageScore: lo, expressionScore: c, engagementScore: c,
      feedback: { strengths: ["Strong camera eye contact"], improvements: ["Hold a steadier posture"] },
    },
  });
  return {
    clerkUserId, role,
    experienceLevel: "Mid-level (3-5 years)",
    interviewType: "Competency / behavioural",
    difficulty: "Standard",
    focusArea: "Balanced",
    practiceMode: "voice-camera",
    totalQuestions: 5,
    overallScore: score,
    hireSignal: signal,
    summary: {
      overall_score: score,
      readiness_score: score,
      hire_signal: signal,
      category_breakdown: cats,
      top_strengths: ["Clear STAR structure", "Quantified, relevant results", "Confident, well-paced delivery"],
      priority_improvements: ["Lead with the result", "Reduce filler words"],
      final_recommendation:
        signal === "Strong"
          ? "Strong candidate — recommend progressing to the next stage."
          : signal === "Moderate"
            ? "Solid candidate — worth a follow-up to probe depth."
            : "Below the bar on this brief at this stage.",
      next_steps: ["Review the per-question feedback", "Compare against the shortlist"],
    },
    results: [
      q(
        "Tell me about a time you led a project under pressure.",
        "In my final year I led a five-person team to rebuild our client's reporting pipeline against a three-week deadline. I split the work into owned streams, ran daily stand-ups, and rewrote the validation layer myself. We shipped two days early and cut report turnaround by 40%.",
      ),
      q(
        "Describe a conflict you resolved within a team.",
        "Two engineers disagreed on the data model. I ran a short spike to test both options, brought the evidence to a 20-minute review, and we aligned on the approach that scaled better — shipping on time with no lingering friction.",
      ),
      q(
        "What is your greatest professional strength?",
        "Turning ambiguity into a plan. On a stalled migration I mapped the unknowns, sequenced the riskiest work first, and we delivered a quarter early.",
      ),
    ],
  };
}

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
          // Was []. An empty results array meant the session detail page had no
          // per-question content at all, so "Review every answer" and the
          // "Model answer (STAR)" panel never rendered on a seeded session.
          results: candidateSession(cid, "Product Manager at a fintech scale-up", t.score, t.signal).results,
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

  // Clear any prior demo candidate sessions (keyed by clerkUserId, not cascaded).
  await prisma.practiceSession.deleteMany({ where: { clerkUserId: { startsWith: "demo-cand-" } } });

  // A realistic, ranked pipeline. Completed candidates get a linked PracticeSession
  // with a full report so the Results list shows scores/signals and the per-candidate
  // detail page renders properly.
  const CANDS: Array<{ name: string; status: string; score?: number; signal?: string }> = [
    { name: "priya.shah", status: "completed", score: 9, signal: "Strong" },
    { name: "tom.baker", status: "completed", score: 8, signal: "Strong" },
    { name: "lucy.chen", status: "completed", score: 7, signal: "Moderate" },
    { name: "sam.okafor", status: "completed", score: 6, signal: "Moderate" },
    { name: "mia.rossi", status: "completed", score: 5, signal: "Weak" },
    { name: "raj.patel", status: "started" },
    { name: "ella.nguyen", status: "started" },
    { name: "jack.ward", status: "pending" },
    { name: "nora.haddad", status: "pending" },
    { name: "leo.martin", status: "pending" },
  ];
  for (let i = 0; i < CANDS.length; i++) {
    const c = CANDS[i];
    const template = templates[i % templates.length];
    let sessionId: string | null = null;
    if (c.status === "completed") {
      const sess = await prisma.practiceSession.create({
        data: candidateSession(`demo-cand-${i}`, template.role, c.score ?? 7, c.signal ?? "Moderate"),
      });
      sessionId = sess.id;
    }
    await prisma.candidateAssignment.create({
      data: {
        companyId: company.id,
        templateId: template.id,
        candidateEmail: `${c.name}@example.com`,
        status: c.status,
        sessionId,
        expiresAt: daysFromNow(21),
        startedAt: c.status !== "pending" ? daysAgo(i + 1) : null,
        completedAt: c.status === "completed" ? daysAgo(i) : null,
        emailSent: true,
        emailSentAt: daysAgo(i + 2),
      },
    });
  }

  return { sessions, company: "Meridian Talent" };
}
