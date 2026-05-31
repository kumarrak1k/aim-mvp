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
import { moderateText } from "@/app/lib/moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  targetRole: z.string().trim().min(1).max(200),
  industry: z.string().trim().max(100).default(""),
  cvText: z.string().trim().min(50).max(8000),
  jobDescription: z.string().trim().max(4000).default(""),
});

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const access = await checkCareerDocAccess(userId, "CV Enhancer");
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, upgrade: access.upgrade },
      { status: access.status }
    );
  }

  const rl = await checkRateLimit(userId, "cv-enhancer", 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, schema);
  if ("response" in parsed) return parsed.response;
  const { targetRole, industry, cvText, jobDescription } = parsed.data;

  if ((await moderateText(cvText)).flagged) {
    return NextResponse.json({ error: "This content can't be processed." }, { status: 400 });
  }

  const systemPrompt = `You are a senior career consultant and professional CV writer with 15+ years of experience helping candidates land roles at top employers. You specialise in ATS optimisation, impactful bullet writing, and making CVs stand out to hiring managers. Return only valid JSON — no markdown, no commentary.`;

  const userPrompt = `Analyse the following CV for a candidate targeting the role of "${targetRole}"${industry ? ` in the ${industry} sector` : ""}.${jobDescription ? `\n\nTarget job description:\n${jobDescription}` : ""}

CV content:
${cvText}

Provide a thorough, specific, actionable analysis. Return JSON matching this exact schema:
{
  "overallScore": <number 1-10>,
  "overallLabel": <string: one-line verdict>,
  "summary": <string: 2-3 sentences of honest top-level assessment>,
  "sections": [
    {
      "name": <section name e.g. "Work Experience", "Skills", "Education">,
      "score": <number 1-10>,
      "feedback": <string: specific feedback on this section — what works and what doesn't>,
      "suggestion": <string: concrete improvement suggestion>
    }
  ],
  "quickWins": [<string>, ...],
  "enhancedBullets": [
    {
      "original": <exact quote from their CV>,
      "enhanced": <rewritten version with strong action verb, scope, and measurable outcome>
    }
  ],
  "missingKeywords": [<keyword string>, ...],
  "atsTips": [<string>, ...],
  "topStrength": <string: the single most impressive thing about this CV>,
  "biggestGap": <string: the most important thing missing or weak>
}

Rules:
- Provide 3-5 quickWins (short, actionable, prioritised)
- Provide 3-5 enhancedBullets (pick the weakest bullets from their actual CV and rewrite them)
- Provide 5-10 missingKeywords relevant to the target role
- Provide 3-4 atsTips
- Be specific and direct — reference actual content from their CV, not generic advice
- If a job description was provided, tailor all feedback to that specific role`;

  const aiResponse = await callOpenAIChat(
    {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    },
    { timeoutMs: 60000 }
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
