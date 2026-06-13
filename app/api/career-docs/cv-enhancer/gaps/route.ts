import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { parseJsonBody } from "@/app/lib/validation";
import { checkCareerDocAccess } from "@/app/lib/careerDocs";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const schema = z.object({
  targetRole: z.string().trim().min(1).max(200),
  industry: z.string().trim().max(100).default(""),
  cvText: z.string().trim().min(50).max(8000),
  jobDescription: z.string().trim().max(8000).default(""),
  analysis: z.object({
    quickWins: z.array(z.string()),
    sections: z.array(z.object({
      name: z.string(),
      feedback: z.string(),
      suggestion: z.string(),
      score: z.number(),
    })),
    biggestGap: z.string(),
    topStrength: z.string(),
    missingKeywords: z.array(z.string()),
    enhancedBullets: z.array(z.object({ original: z.string(), enhanced: z.string() })),
  }),
});

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const access = await checkCareerDocAccess(userId, "Enhanced CV");
  if (!access.ok) {
    return NextResponse.json({ error: access.error, upgrade: access.upgrade }, { status: access.status });
  }

  const parsed = await parseJsonBody(request, schema);
  if ("response" in parsed) return parsed.response;
  const { targetRole, industry, cvText, jobDescription, analysis } = parsed.data;

  const sectionSuggestions = analysis.sections
    .map((s) => `  ${s.name}: ${s.suggestion}`)
    .join("\n");

  const prompt = `You are reviewing a CV to identify critical information gaps for a "${targetRole}"${industry ? ` in ${industry}` : ""} role.

CV TEXT:
${cvText}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n\n` : ""}RECOMMENDATIONS TO APPLY:
${sectionSuggestions}
Biggest gap: ${analysis.biggestGap}

TASK: Identify up to 4 pieces of information that would significantly strengthen this CV for the target role but are GENUINELY ABSENT from the CV text — information that cannot be reasonably inferred, estimated, or constructed from any existing content.

Rules:
- Do NOT flag something if ANY related content exists in the CV (the writer will infer from that)
- Only flag factual details the candidate would know but hasn't written: team sizes, budget figures, client names, specific tools used, geographic scope, measurable outcomes
- Prioritise the most impactful gaps for the target role
- If there are no genuine gaps, return an empty array

For each gap, write a short friendly question (1 sentence) and an example of a good answer.

Return JSON:
{
  "gaps": [
    {
      "id": "gap-0",
      "section": "<CV section this relates to>",
      "question": "<short friendly question ending with ?>",
      "hint": "<example placeholder, e.g. 'e.g. Led a team of 12 across UK and US offices'>"
    }
  ]
}`;

  const aiResponse = await callOpenAIChat(
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    },
    { timeoutMs: 25000 }
  );

  const raw = stripFences(aiResponse.choices[0].message.content);
  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json({ gaps: parsed.gaps ?? [] });
  } catch {
    return NextResponse.json({ gaps: [] });
  }
}
