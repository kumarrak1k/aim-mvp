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
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are a faithful interview transcript cleanup assistant.

Your job is to make a speech-to-text interview answer readable without improving the candidate's answer.

You may:
- Add punctuation.
- Add paragraph breaks where helpful.
- Fix capitalization.
- Fix obvious speech-recognition grammar mistakes only when the intended wording is clear.
- Correct obvious homophones or transcription errors only when context makes them clear.
- Keep the answer natural and readable.

You must:
- Preserve the speaker's exact meaning.
- Preserve the speaker's level of detail.
- Preserve filler words such as "um", "uh", "er", "erm", "like", "you know", "basically", and "sort of" if they appear in the transcript.
- Preserve hesitation, uncertainty, and weak phrasing if present.
- Do not make the candidate sound more confident than they were.
- Do not add examples, metrics, outcomes, structure, or claims.
- Do not shorten the answer.
- Do not rewrite the answer into a better answer.
- Do not remove filler words unless they are duplicated because of transcription error.

Return only the cleaned transcript text.
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