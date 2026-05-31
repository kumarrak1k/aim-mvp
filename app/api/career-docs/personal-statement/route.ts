import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";
import {
  checkCareerDocAccess,
  recordCareerDocGeneration,
} from "@/app/lib/careerDocs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  statementType: z.enum(["university", "graduate-scheme", "mba", "professional-role", "masters"]),
  targetProgramOrRole: z.string().trim().min(1).max(300),
  institution: z.string().trim().max(200).default(""),
  whyThis: z.string().trim().min(20).max(2000),
  background: z.string().trim().min(20).max(8000),
  achievements: z.string().trim().min(10).max(2000),
  wordLimit: z.number().int().min(300).max(1000).default(500),
});

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

const typeLabels: Record<string, string> = {
  "university": "undergraduate university application",
  "graduate-scheme": "graduate scheme application",
  "mba": "MBA programme application",
  "professional-role": "professional job application",
  "masters": "postgraduate Master's application",
};

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const access = await checkCareerDocAccess(userId, "Personal Statement Generator");
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, upgrade: access.upgrade },
      { status: access.status }
    );
  }

  const rl = await checkRateLimit(userId, "personal-statement", 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, schema);
  if ("response" in parsed) return parsed.response;
  const { statementType, targetProgramOrRole, institution, whyThis, background, achievements, wordLimit } = parsed.data;

  const typeLabel = typeLabels[statementType] ?? statementType;

  const systemPrompt = `You are an expert admissions consultant and personal statement writer with experience helping candidates gain places at Oxford, LSE, McKinsey graduate programmes, Big 4 schemes, and top MBA programmes. You write authentic, compelling personal statements that feel genuinely personal — not generic or corporate. Return only valid JSON.`;

  const userPrompt = `Write a personal statement for a ${typeLabel}${institution ? ` at ${institution}` : ""}.

Target programme/role: ${targetProgramOrRole}

Why this programme or role (candidate's own words):
${whyThis}

Academic and professional background:
${background}

Key achievements:
${achievements}

Target word count: ~${wordLimit} words (±5%)

Return JSON matching this schema exactly:
{
  "statement": <full personal statement text, using \\n\\n for paragraph breaks>,
  "wordCount": <integer>,
  "openingHook": <string: describe the approach taken for the opening>,
  "keyNarrativeThread": <string: the central theme or story that runs through the statement>,
  "strengths": [<string: 3 things that work well in this statement>],
  "suggestions": [<string: 3 ways to personalise or strengthen before submitting>]
}

Rules:
- Open with a hook — a specific moment, insight, or realisation — not "I have always been passionate about..."
- Build a coherent narrative arc: what shaped your interest → what you have done → why this specific programme/role → what you bring
- Weave in specific examples and achievements naturally, not as a list
- For university/masters statements: reference academic interest and intellectual curiosity
- For graduate schemes/professional roles: emphasise commercial awareness, leadership, and transferable skills
- For MBA: focus on leadership journey, career progression logic, and contribution to the cohort
- The statement must feel authentic and specific — avoid clichés and vague assertions
- End with forward-looking purpose, not just a restatement of ambition`;

  const aiResponse = await callOpenAIChat(
    {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.65,
      max_tokens: 2500,
    },
    { timeoutMs: 60000 }
  );

  const raw = stripFences(aiResponse.choices[0].message.content);
  try {
    const result = JSON.parse(raw);
    await recordCareerDocGeneration(userId, "personal-statement");
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
  }
}
