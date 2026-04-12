import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const role = body.role || "General candidate";
    const questionNumber = Number(body.questionNumber || 1);
    const totalQuestions = Number(body.totalQuestions || 5);
    const history = Array.isArray(body.history) ? body.history : [];

    const formattedHistory =
      history.length > 0
        ? history
            .map(
              (item: { question: string; answer: string }, index: number) =>
                `Previous Q${index + 1}: ${item.question}\nPrevious A${index + 1}: ${item.answer}`
            )
            .join("\n\n")
        : "No previous questions yet.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `
You are AIM, an elite AI interview coach.

Your task:
- Generate ONE realistic interview question at a time
- Match the user's profile and level
- Support graduates, students, placement candidates, interns, and professionals
- Increase difficulty slightly as the interview progresses
- Avoid repeating previous questions
- Ask only the question
- Do not greet
- Do not explain anything
- Output only plain text

Interview context:
- This is question ${questionNumber} of ${totalQuestions}
- Candidate profile: ${role}

Previous questions and answers:
${formattedHistory}
          `.trim(),
        },
      ],
    });

    return Response.json({
      question: response.choices[0].message.content?.trim() || "Tell me about yourself.",
    });
  } catch (error: any) {
    console.error("INTERVIEW API ERROR:", error);

    return Response.json(
      {
        error: "Failed to generate interview question",
      },
      { status: 500 }
    );
  }
}