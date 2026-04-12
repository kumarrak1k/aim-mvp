import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return Response.json(
        { error: "Transcript is required." },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are a transcript cleanup assistant.

Your job:
- Add punctuation
- Break text into readable sentences
- Fix capitalization
- Preserve the speaker's exact meaning
- Do NOT shorten
- Do NOT rewrite content heavily
- Do NOT add new information
- Return only the cleaned transcript text
          `.trim(),
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    return Response.json({
      cleanedTranscript:
        response.choices[0].message.content?.trim() || transcript,
    });
  } catch (error: any) {
    console.error("CLEAN TRANSCRIPT API ERROR:", error);

    return Response.json(
      {
        error: "Failed to clean transcript.",
      },
      { status: 500 }
    );
  }
}