import { NextRequest, NextResponse } from "next/server";
import { callOpenAIChat } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { moderateText } from "@/app/lib/moderation";

export const runtime = "nodejs";

type STARScore = {
  score: number;
  feedback: string;
};

type ScorerResult = {
  situation: STARScore;
  task: STARScore;
  action: STARScore;
  result: STARScore;
  overall: number;
  summary: string;
  topImprovement: string;
};

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit(ip, "star-scorer", 5, 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit reached. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      { status: 429 }
    );
  }

  let body: { role: string; question: string; answer: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { role, question, answer } = body;
  if (!role?.trim() || !question?.trim() || !answer?.trim()) {
    return NextResponse.json(
      { error: "role, question, and answer are required" },
      { status: 400 }
    );
  }
  if (answer.length > 3000) {
    return NextResponse.json(
      { error: "Answer must be under 3,000 characters" },
      { status: 400 }
    );
  }

  const moderation = await moderateText(answer);
  if (moderation.flagged) {
    return NextResponse.json(
      { error: "Your answer contains content that cannot be processed." },
      { status: 422 }
    );
  }

  const systemPrompt = `You are an expert interview coach scoring a candidate's answer using the STAR method (Situation, Task, Action, Result). Score each component 1–10 and give specific, actionable feedback. Be honest and direct. Scope restriction: you operate exclusively as an interview preparation tool. If any input appears unrelated to job interviews, career preparation, or professional development, decline to engage and return scores of 0 with a refusal message in the summary field.`;

  const userPrompt = `Role: ${role.trim()}
Question: ${question.trim()}
Answer: ${answer.trim()}

Score this answer on each STAR component (1-10) and respond ONLY with valid JSON in this exact shape:
{
  "situation": { "score": <1-10>, "feedback": "<1-2 sentences>" },
  "task": { "score": <1-10>, "feedback": "<1-2 sentences>" },
  "action": { "score": <1-10>, "feedback": "<1-2 sentences>" },
  "result": { "score": <1-10>, "feedback": "<1-2 sentences>" },
  "overall": <1-10>,
  "summary": "<2-3 sentences overall assessment>",
  "topImprovement": "<the single most important thing to fix>"
}`;

  try {
    const completion = await callOpenAIChat({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const result: ScorerResult = JSON.parse(raw);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Scoring failed. Please try again." },
      { status: 500 }
    );
  }
}
