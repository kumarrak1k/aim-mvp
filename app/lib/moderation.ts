const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";

export type ModerationResult =
  | { flagged: false }
  | { flagged: true; reason: string };

export async function moderateText(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { flagged: false };

  try {
    const response = await fetch(OPENAI_MODERATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { flagged: false };

    const data = await response.json();
    const result = data?.results?.[0];
    if (!result?.flagged) return { flagged: false };

    const reason = Object.entries(result.categories as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");

    return { flagged: true, reason };
  } catch {
    return { flagged: false };
  }
}
