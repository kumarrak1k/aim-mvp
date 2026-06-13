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
export const maxDuration = 90;
export const dynamic = "force-dynamic";

const schema = z.object({
  targetRole: z.string().trim().min(1).max(200),
  industry: z.string().trim().max(100).default(""),
  cvText: z.string().trim().min(50).max(8000),
  jobDescription: z.string().trim().max(8000).default(""),
  analysis: z.object({
    quickWins: z.array(z.string()),
    enhancedBullets: z.array(z.object({ original: z.string(), enhanced: z.string() })),
    missingKeywords: z.array(z.string()),
    sections: z.array(z.object({
      name: z.string(),
      score: z.number(),
      feedback: z.string(),
      suggestion: z.string(),
    })),
    biggestGap: z.string(),
    topStrength: z.string(),
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
    return NextResponse.json(
      { error: access.error, upgrade: access.upgrade },
      { status: access.status }
    );
  }

  const rl = await checkRateLimit(userId, "cv-enhancer-generate", 5, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const parsed = await parseJsonBody(request, schema);
  if ("response" in parsed) return parsed.response;
  const { targetRole, industry, cvText, jobDescription, analysis } = parsed.data;

  const systemPrompt = `You are a senior professional CV writer. Rewrite the candidate's CV applying the given recommendations exactly. Preserve all facts — never invent metrics, dates, employer names, or roles. Return only valid JSON, no markdown, no commentary.`;

  const bulletRewrites = analysis.enhancedBullets
    .map((b) => `  - "${b.original}" → "${b.enhanced}"`)
    .join("\n");

  const sectionSuggestions = analysis.sections
    .map((s) => `  - ${s.name}: ${s.suggestion}`)
    .join("\n");

  const userPrompt = `Rewrite this CV for "${targetRole}"${industry ? ` in ${industry}` : ""}.

ORIGINAL CV:
${cvText}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n\n` : ""}RECOMMENDATIONS TO APPLY:
Quick wins: ${analysis.quickWins.join("; ")}
Bullet rewrites:
${bulletRewrites}
Keywords to weave in naturally: ${analysis.missingKeywords.join(", ")}
Section improvements:
${sectionSuggestions}
Biggest gap to address: ${analysis.biggestGap}

RULES:
1. Apply every recommendation you can without inventing facts.
2. Use stronger action verbs; add scope/impact only where already implied in the original.
3. Preserve all dates, employer names, job titles, education details exactly.
4. Where specific data is missing (e.g. exact team size, budget, percentage), insert a [NEEDS INPUT: what's needed] placeholder rather than guessing.
5. The "original" in each change entry must be an EXACT substring of the original CV text above.
6. The "replacement" in each change entry must appear verbatim in fullEnhancedCV.

Return JSON:
{
  "fullEnhancedCV": "<complete rewritten CV as plain text, preserving structure and spacing>",
  "changes": [
    {
      "id": "change-0",
      "section": "<CV section name>",
      "original": "<exact substring from the ORIGINAL CV that was replaced>",
      "replacement": "<the text that replaces it in fullEnhancedCV>",
      "reason": "<one sentence: why this improves the CV>"
    }
  ],
  "flagged": [
    {
      "section": "<CV section name>",
      "note": "<what the candidate needs to supply — be specific>"
    }
  ]
}`;

  const aiResponse = await callOpenAIChat(
    {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    },
    { timeoutMs: 90000 }
  );

  const raw = stripFences(aiResponse.choices[0].message.content);
  try {
    const result = JSON.parse(raw);
    await recordCareerDocGeneration(userId, "cv-enhancer");
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
  }
}
