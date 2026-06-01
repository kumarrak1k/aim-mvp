import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";
import { getCandidatePlan, TRIAL_USAGE_CAPS } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const startSchema = z.object({
  role: z.string().trim().min(1).max(200),
  sector: z.string().trim().min(1).max(100),
  experienceLevel: z.string().trim().min(1).max(80),
  selectedStages: z
    .array(z.enum(["stage1", "stage2", "stage3"]))
    .min(1)
    .default(["stage1", "stage2", "stage3"]),
});

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rl = await checkRateLimit(userId, "assessment-centre-start", 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const plan = await getCandidatePlan(userId);
  if (!plan.isProfessional) {
    return NextResponse.json(
      { error: "Assessment centre requires the Professional plan." },
      { status: 403 }
    );
  }

  // Fair-usage cap during the free trial (cost control). Paid Professional is
  // unlimited; the cap only applies while access comes from the no-card trial.
  if (plan.isTrial) {
    const since = plan.trialStartedAt ? new Date(plan.trialStartedAt) : undefined;
    const used = await prisma.assessmentCentreSession.count({
      where: { clerkUserId: userId, ...(since && { createdAt: { gte: since } }) },
    });
    if (used >= TRIAL_USAGE_CAPS.assessmentCentres) {
      return NextResponse.json(
        {
          error: `Your free trial includes ${TRIAL_USAGE_CAPS.assessmentCentres} mock assessment centres. Upgrade to Professional for unlimited assessment centres.`,
        },
        { status: 429 }
      );
    }
  }

  const parsed = await parseJsonBody(request, startSchema);
  if ("response" in parsed) return parsed.response;
  const { role, sector, experienceLevel, selectedStages } = parsed.data;

  const hasStage1 = selectedStages.includes("stage1");
  const hasStage2 = selectedStages.includes("stage2");

  // Determine initial status based on first selected stage
  const initialStatus = hasStage1 ? "stage1" : hasStage2 ? "stage2" : "stage3";
  const initialStageNum = hasStage1 ? 1 : hasStage2 ? 2 : 3;

  let scenario: unknown = null;

  if (hasStage1) {
    const systemPrompt = `You are a senior assessment centre designer at a top-tier consultancy. You create rigorous, realistic business case studies for graduate and professional assessment centres — equivalent in depth to those used by McKinsey, Deloitte, KPMG, and large corporates. Output must be valid JSON only — no markdown fences, no commentary.`;

    const userPrompt = `Create a comprehensive, realistic assessment centre case study for a ${role} candidate (${experienceLevel}) in the ${sector} sector.

The case study must be substantial and detailed — matching the depth of a real graduate or professional assessment centre pack. Follow these requirements exactly:

OVERVIEW (overview field): Write 3–4 paragraphs covering: (1) the company's history, size, and core business model; (2) its market position, key products/services, and competitive landscape; (3) recent financial performance trajectory and strategic context. Be specific — include realistic revenue figures, headcount, and market share percentages.

CHALLENGE (challenge field): Write 2–3 paragraphs describing a complex, multi-faceted business problem. Include what triggered it, which parts of the business are affected, and what is at stake if not resolved. Make it nuanced — not a single obvious fix.

EXHIBITS (exhibits field): Provide exactly 3–4 exhibits. Each exhibit content MUST be a STRING (not an array). Use newline characters within the string for line breaks. Format tables using markdown pipe syntax (| Col1 | Col2 |). Include:
- Exhibit 1: A 3-year financial summary table (revenue, gross profit, EBITDA, net income, key cost lines — show YoY trend)
- Exhibit 2: An operational or market data table (relevant KPIs vs prior year and vs industry benchmark, or market share by segment)
- Exhibit 3: Customer or stakeholder insight data (satisfaction metrics, NPS, key feedback themes, segment breakdown)
- Exhibit 4 (optional but recommended): Workforce data, strategic options summary, or risk register — whichever is most relevant to the challenge

TASK (task field): A realistic 12-minute written task instruction framed as if the candidate is a consultant or analyst advising senior leadership. Be specific about the role they are playing and what deliverable is expected.

QUESTION (question field): One substantive, specific question that requires synthesis of at least two exhibits. It should demand a structured recommendation with supporting evidence — not a simple factual answer.

GUIDANCE (guidance field): Provide 5 practical tips for structuring an excellent response — include advice on frameworks (e.g. issue tree, pyramid principle), how to use the data, and common pitfalls to avoid.

Return valid JSON matching this schema exactly:
{ "company": string, "industry": string, "overview": string, "challenge": string, "exhibits": [{"title": string, "content": string}], "task": string, "question": string, "guidance": string[] }`;

    const aiResponse = await callOpenAIChat({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }, { timeoutMs: 90000 });

    const raw = stripMarkdownFences(aiResponse.choices[0].message.content);
    try {
      scenario = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Failed to parse scenario from AI." }, { status: 500 });
    }
  }

  const session = await prisma.assessmentCentreSession.create({
    data: {
      clerkUserId: userId,
      role,
      sector,
      experienceLevel,
      selectedStages,
      status: initialStatus,
      currentStage: initialStageNum,
      ...(scenario ? { caseStudyScenario: scenario as object } : {}),
    },
  });

  return NextResponse.json({ id: session.id, ...(scenario ? { scenario } : {}) });
}
