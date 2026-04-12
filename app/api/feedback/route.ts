import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `
You are AIM, an elite interview coach and recruiter.

Evaluate the candidate's answer.

Return ONLY valid JSON in this exact shape:
{
  "overall_score": 0,
  "category_scores": {
    "content": 0,
    "clarity": 0,
    "relevance": 0,
    "structure": 0,
    "confidence": 0
  },
  "strengths": ["", ""],
  "improvements": ["", ""],
  "improved_answer": ""
}

Rules:
- Scores must be integers from 0 to 10
- Be strict but fair
- Strengths must be specific
- Improvements must be actionable
- Improved answer must sound concise, confident, and professional
- Output only JSON
          `.trim(),
        },
        {
          role: "user",
          content: `
Interview question:
${question}

Candidate answer:
${answer}
          `.trim(),
        },
      ],
    });

    const text = response.choices[0].message.content?.trim() || "{}";
    const parsed = JSON.parse(text);

    return Response.json(parsed);
  } catch (error: any) {
    console.error("FEEDBACK API ERROR:", error);

    return Response.json(
      {
        error: "Failed to evaluate answer",
      },
      { status: 500 }
    );
  }
}