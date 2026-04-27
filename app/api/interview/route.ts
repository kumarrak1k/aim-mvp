import { NextRequest, NextResponse } from "next/server";

type InterviewHistoryItem = {
  question: string;
  answer: string;
};

export async function POST(req: NextRequest) {
  try {
    const { role, questionNumber, totalQuestions, history } = await req.json();

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Missing target role or profile." },
        { status: 400 }
      );
    }

    const safeQuestionNumber =
      typeof questionNumber === "number" && questionNumber > 0
        ? questionNumber
        : 1;

    const safeTotalQuestions =
      typeof totalQuestions === "number" && totalQuestions > 0
        ? totalQuestions
        : 5;

    const safeHistory: InterviewHistoryItem[] = Array.isArray(history)
      ? history
      : [];

    const systemPrompt = `
You are an expert interview coach.

Your job is to generate realistic interview questions for candidates.

Rules:
- Ask one question only.
- Do not include explanations.
- Do not include numbering.
- Do not include markdown.
- Make the question relevant to the candidate's target role/profile.
- Make the question realistic for a real interview.
- Vary the question style across the interview.
- Avoid repeating previous questions.
- Use clear, professional language.

Question mix:
- Early questions can test motivation, background, and role fit.
- Middle questions should test experience, examples, problem-solving, teamwork, communication, and resilience.
- Later questions can test judgement, self-awareness, growth, and impact.
`;

    const historyText =
      safeHistory.length > 0
        ? safeHistory
            .map(
              (item, index) =>
                `Previous question ${index + 1}: ${item.question}\nCandidate answer ${index + 1}: ${item.answer}`
            )
            .join("\n\n")
        : "No previous questions yet.";

    const userPrompt = `
Candidate target role/profile:
${role}

Question number:
${safeQuestionNumber} of ${safeTotalQuestions}

Previous interview history:
${historyText}

Generate the next best interview question.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to generate interview question." },
        { status: 500 }
      );
    }

    const question = data.choices?.[0]?.message?.content?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "No question returned from AI." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      question,
    });
  } catch (error) {
    console.error("INTERVIEW API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the question." },
      { status: 500 }
    );
  }
}