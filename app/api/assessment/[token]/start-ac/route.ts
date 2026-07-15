/**
 * POST /api/assessment/[token]/start-ac
 *
 * Creates an AssessmentCentreSession from a company invite that uses an
 * "assessment-centre" template.  Unlike the candidate self-serve start route
 * this does NOT require the Advanced plan — the company's plan is used instead.
 *
 * Idempotent: if the assignment already has an acSessionId we return the
 * existing session so a browser refresh doesn't create a duplicate.
 */

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { MODEL_PREMIUM } from "@/app/lib/aiModels";
import { checkRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 180;
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

function isValidTokenFormat(token: string): boolean {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(token);
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { token } = await params;
    if (!isValidTokenFormat(token)) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    }

    // Rate limit: cap AC starts per user per hour (generous — per-token idempotency handles the real protection)
    const rl = await checkRateLimit(userId, "assessment-centre-start", 10, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    // Load the assignment + template
    const assignment = await prisma.candidateAssignment.findUnique({
      where: { inviteToken: token },
      include: {
        template: true,
        company: { select: { name: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    }
    if (assignment.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }
    if (assignment.status === "completed") {
      return NextResponse.json({ error: "This assessment has already been completed." }, { status: 409 });
    }

    const template = assignment.template;
    if (template.templateType !== "assessment-centre") {
      return NextResponse.json({ error: "This invite is for an interview, not an assessment centre." }, { status: 400 });
    }

    // Idempotency: return existing session if already started
    if (assignment.acSessionId) {
      const existing = await prisma.assessmentCentreSession.findUnique({
        where: { id: assignment.acSessionId },
      });
      if (existing) {
        return NextResponse.json({ sessionId: existing.id, initialStage: existing.currentStage });
      }
    }

    const selectedStages = (template.acStages as string[]).length > 0
      ? (template.acStages as Array<"stage1" | "stage2" | "stage3">)
      : ["stage1", "stage2", "stage3"] as const;

    const hasStage1 = selectedStages.includes("stage1");
    const hasStage2 = selectedStages.includes("stage2");
    const hasStage3 = selectedStages.includes("stage3");
    const initialStatus = hasStage1 ? "stage1" : hasStage2 ? "stage2" : "stage3";
    const initialStageNum = hasStage1 ? 1 : hasStage2 ? 2 : 3;

    // Build templateConfig for stage-2 interview so that stage uses the
    // template's interview settings rather than hardcoded defaults.
    const templateConfig = {
      interviewType: template.interviewType,
      difficulty: template.difficulty,
      focusArea: template.focusArea,
      questionCount: template.questionCount,
      questionMix: template.questionMix ?? null,
      customInstructions: template.customInstructions ?? null,
      competencyFramework: template.competencyFramework ?? null,
    };

    // Generate case study scenario if stage1 is included
    let scenario: unknown = null;
    let presentationBrief: unknown = null;

    // When stage3 is the only selected stage, generate the brief now — there is
    // no submit-case-study or submit-interview call to generate it later.
    if (!hasStage1 && !hasStage2 && hasStage3) {
      const briefSystemPrompt = `You are a senior assessment centre designer. Generate a realistic presentation brief appropriate for a ${template.role} candidate in the ${assignment.company.name} sector. JSON only.`;
      const briefUserPrompt = `Generate a presentation brief for a ${template.role} in ${assignment.company.name}. Return JSON: { "topic": "<topic string>", "audience": "<audience string>", "context": "<2-3 sentences of background>", "format": "3-minute spoken presentation", "objectives": ["<objective 1>", "<objective 2>", "<objective 3>"], "timeMinutes": 3 }`;

      const briefResponse = await callOpenAIChat(
        {
          model: MODEL_PREMIUM,
          messages: [
            { role: "system", content: briefSystemPrompt },
            { role: "user", content: briefUserPrompt },
          ],
          temperature: 0.8,
          max_tokens: 800,
        },
        { timeoutMs: 45000 }
      );

      const rawBrief = stripMarkdownFences(briefResponse.choices[0].message.content);
      try {
        presentationBrief = JSON.parse(rawBrief);
      } catch {
        presentationBrief = { topic: "Strategic market expansion", audience: "Senior leadership team", context: "The company is evaluating growth opportunities.", format: "3-minute spoken presentation", objectives: ["Present a clear recommendation", "Back it with evidence", "Outline key risks"], timeMinutes: 3 };
      }
    }

    if (hasStage1) {
      const systemPrompt = `You are a senior assessment centre designer at a top-tier consultancy. You create rigorous, realistic business case studies for graduate and professional assessment centres — equivalent in depth to those used by McKinsey, Deloitte, KPMG, and large corporates. Output must be valid JSON only — no markdown fences, no commentary.`;

      const userPrompt = `Create a comprehensive, realistic assessment centre case study for a ${template.role} candidate (${template.experienceLevel}) in the ${assignment.company.name} sector.

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

      const aiResponse = await callOpenAIChat(
        {
          model: MODEL_PREMIUM,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        },
        { timeoutMs: 90000 }
      );

      const raw = stripMarkdownFences(aiResponse.choices[0].message.content);
      try {
        scenario = JSON.parse(raw);
      } catch {
        return NextResponse.json({ error: "Failed to parse scenario from AI." }, { status: 500 });
      }
    }

    // Create the AC session
    const session = await prisma.assessmentCentreSession.create({
      data: {
        clerkUserId: userId,
        assignmentToken: token,
        templateConfig: templateConfig as object,
        role: template.role,
        sector: assignment.company.name, // use company name as sector proxy for company invites
        experienceLevel: template.experienceLevel,
        selectedStages: selectedStages as string[],
        status: initialStatus,
        currentStage: initialStageNum,
        ...(scenario ? { caseStudyScenario: scenario as object } : {}),
        ...(presentationBrief ? { presentationBrief: presentationBrief as object } : {}),
      },
    });

    // Link the session back to the assignment and mark as started
    await prisma.candidateAssignment.update({
      where: { inviteToken: token },
      data: {
        acSessionId: session.id,
        clerkUserId: userId,
        status: "started",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ sessionId: session.id, initialStage: initialStageNum });
  } catch (error) {
    console.error("ASSESSMENT START-AC ERROR:", error);
    return NextResponse.json({ error: "Failed to start assessment centre." }, { status: 500 });
  }
}
