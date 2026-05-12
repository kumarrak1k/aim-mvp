import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { parseJsonBody } from "@/app/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  companyName: z.string().trim().min(1).max(200),
  jobTitle: z.string().trim().min(1).max(200),
  jobDescription: z.string().trim().min(20).max(5000),
  experience: z.string().trim().min(20).max(3000),
  tone: z.enum(["professional", "enthusiastic", "concise"]).default("professional"),
  wordLimit: z.number().int().min(200).max(600).default(350),
});

async function requireAdvancedPlan(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.privateMetadata as { subscriptionStatus?: string; stripePlanId?: string };
    const isActive = meta?.subscriptionStatus === "active";
    return isActive && (meta?.stripePlanId ?? "").toLowerCase().includes("advanced");
  } catch {
    return false;
  }
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  if (!(await requireAdvancedPlan(userId))) {
    return NextResponse.json(
      { error: "Cover Letter Generator requires the Advanced plan.", upgrade: true },
      { status: 403 }
    );
  }

  const rl = await checkRateLimit(userId, "cover-letter", 15, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, schema);
  if ("response" in parsed) return parsed.response;
  const { companyName, jobTitle, jobDescription, experience, tone, wordLimit } = parsed.data;

  const toneGuide = {
    professional: "formal, polished, and measured — conveying quiet confidence and credibility",
    enthusiastic: "warm, energetic, and genuinely excited — showing authentic passion for the role and company",
    concise: "sharp, direct, and efficient — every sentence earns its place, no padding",
  }[tone];

  const systemPrompt = `You are an expert career coach and cover letter specialist. You write compelling, tailored cover letters that get candidates interviews. Your letters feel personal, not templated — they connect the candidate's specific achievements to the employer's actual needs. Return only valid JSON.`;

  const userPrompt = `Write a cover letter for:
- Role: ${jobTitle} at ${companyName}
- Tone: ${toneGuide}
- Target word count: ~${wordLimit} words (strict — stay within ±10%)

Job description:
${jobDescription}

Candidate's relevant experience and background:
${experience}

Return JSON matching this schema exactly:
{
  "letter": <full cover letter text, using \\n for line breaks between paragraphs>,
  "wordCount": <integer>,
  "subject": <suggested email subject line>,
  "keyThemes": [<string: 3 key themes the letter focuses on>],
  "customisationTips": [<string: 2-3 tips for personalising further before sending>]
}

Rules:
- Open with something specific and compelling — not "I am writing to apply for..."
- Mirror language from the job description naturally (not robotically)
- Include 1-2 specific, quantified achievements from their experience
- End with a clear, confident call to action
- Do NOT use placeholder text like [your name] or [date] — the letter should be ready to use`;

  const aiResponse = await callOpenAIChat(
    {
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    },
    { timeoutMs: 45000 }
  );

  const raw = stripFences(aiResponse.choices[0].message.content);
  try {
    const result = JSON.parse(raw);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
  }
}
