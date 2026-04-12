import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { role, results } = await req.json();

    const formattedResults = Array.isArray(results)
      ? results
          .map(
            (
              item: {
                question: string;
                answer: string;
                feedback: {
                  overall_score: number;
                  strengths: string[];
                  improvements: string[];
                };
              },
              index: number
            ) => `
Question ${index + 1}: ${item.question}
Answer ${index + 1}: ${item.answer}
Score ${index + 1}: ${item.feedback?.overall_score ?? 0}
Strengths ${index + 1}: ${(item.feedback?.strengths || []).join("; ")}
Improvements ${index + 1}: ${(item.feedback?.improvements || []).join("; ")}
`
          )
          .join("\n")
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `
You are AIM, an elite interview coach.

Create a final interview summary.

Return ONLY valid JSON in this exact shape:
{
  "overall_score": 0,
  "hire_signal": "Weak" ,
  "top_strengths": ["", ""],
  "top_improvements": ["", ""],
  "final_recommendation": "",
  "next_steps": ["", "", ""]
}

Rules:
- overall_score is integer 0-10
- hire_signal must be one of: "Weak", "Moderate", "Strong"
- final_recommendation must be concise and encouraging
- output only JSON
          `.trim(),
        },
        {
          role: "user",
          content: `
Candidate profile:
${role}

Interview results:
${formattedResults}
          `.trim(),
        },
      ],
    });

    const text = response.choices[0].message.content?.trim() || "{}";
    const parsed = JSON.parse(text);

    return Response.json(parsed);
  } catch (error: any) {
    console.error("SUMMARY API ERROR:", error);

    return Response.json(
      {
        error: "Failed to generate interview summary",
      },
      { status: 500 }
    );
  }
}