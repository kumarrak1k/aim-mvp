/**
 * Deterministic OpenAI mock for the automated test pack.
 *
 * Activated ONLY when `process.env.AIM_TEST_MODE === "mock"` (set by the test
 * runner, never in production). `callOpenAIChat()` dynamically imports this so
 * the canned fixtures are code-split out of the production bundle.
 *
 * It returns canned, schema-exact `choices[0].message.content` STRINGS — i.e.
 * the routes' real JSON parsing/cleaning still runs, so the mock also exercises
 * the parsers. Discrimination is by distinctive markers in the prompts.
 *
 * Covered (verified against the routes): /feedback, /interview.
 * Best-effort (not on the typed critical path): /tools/star-scorer,
 * /clean-transcript. /summary is mocked separately in its own route (it uses
 * the OpenAI SDK directly and already has a deterministic fallback).
 */
import type { ChatCompletionRequest } from "./openai-client";

const MOCK_FEEDBACK = {
  overall_score: 8,
  category_scores: { content: 8, clarity: 8, relevance: 8, structure: 8, confidence: 7 },
  pace_score: 7,
  section_feedback: {
    content: { score: 8, feedback: "Strong, specific example with a clear result.", improvement: "Add one more quantified outcome." },
    clarity: { score: 8, feedback: "Easy to follow and concise.", improvement: "Tighten the opening sentence." },
    relevance: { score: 8, feedback: "Directly answers the question.", improvement: "Tie the result back to the role." },
    structure: { score: 8, feedback: "Clean STAR structure.", improvement: "Signpost the Result more clearly." },
    confidence: { score: 7, feedback: "Assertive and credible.", improvement: "Remove the one hedging phrase." },
    pace: { score: 7, feedback: "Measured delivery.", improvement: "Maintain this pace." },
  },
  strengths: ["Clear STAR structure", "Quantified result", "Directly relevant to the role"],
  improvements: ["Add a second measurable outcome", "Lead with the result"],
  improved_answer:
    "In my final-year project (Situation) I was tasked with cutting report turnaround (Task). I redesigned the data pipeline and automated the validation checks (Action), which cut turnaround by 40% and was adopted across the team (Result).",
};

const MOCK_QUESTIONS = [
  "Tell me about yourself and why you're interested in this role.",
  "Describe a time you faced a significant challenge at work and how you handled it.",
  "Tell me about a time you had a conflict with a colleague and how you resolved it.",
  "What is your greatest professional strength, and can you give an example?",
  "Describe a time you had to learn something new quickly to deliver a result.",
  "Tell me about a time you led a piece of work or a team.",
];

function systemContent(request: ChatCompletionRequest): string {
  return request.messages.find((m) => m.role === "system")?.content ?? "";
}
function allContent(request: ChatCompletionRequest): string {
  return request.messages.map((m) => m.content).join("\n");
}

/** Canned `message.content` string for a chat request, by prompt markers. */
export function mockChatCompletion(request: ChatCompletionRequest): string {
  const sys = systemContent(request);
  const all = allContent(request);

  // /feedback — its system prompt defines the category_scores schema.
  if (sys.includes("category_scores") || all.includes('"category_scores"')) {
    return JSON.stringify(MOCK_FEEDBACK);
  }

  // /interview — returns one { question } per call. Rotate by how many answers
  // are already in the history block so the bot sees varied, intent-matchable
  // questions across the session.
  if (sys.includes("interview question generator") || all.includes('"question": "string"')) {
    const answered = (all.match(/Answer \d+:/g) || []).length;
    return JSON.stringify({ question: MOCK_QUESTIONS[answered % MOCK_QUESTIONS.length] });
  }

  // /tools/star-scorer — best-effort STAR breakdown (not on the typed path).
  if (all.includes("STAR") && all.includes("score")) {
    return JSON.stringify({
      score: 8,
      situation: { score: 8, feedback: "Clear context." },
      task: { score: 8, feedback: "Well-defined objective." },
      action: { score: 8, feedback: "Specific, owned actions." },
      result: { score: 8, feedback: "Quantified outcome." },
      overall: "A strong STAR answer.",
    });
  }

  // /clean-transcript — best-effort echo.
  if (sys.includes("transcript") || all.toLowerCase().includes("clean")) {
    return JSON.stringify({ cleaned: "This is a cleaned interview transcript." });
  }

  // Benign default for any other callOpenAIChat caller in mock mode.
  return JSON.stringify({ ok: true });
}
