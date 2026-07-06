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

// Assessment-centre: the case-study scenario (start-ac) and the scoring (submit).
const MOCK_AC_SCENARIO = {
  company: "Northwind Retail",
  industry: "Retail",
  overview:
    "Northwind Retail is a mid-sized UK retailer founded in 1998, with revenue of £420m, ~3,200 staff and 140 stores. It holds roughly 6% share of a competitive non-food segment and has historically competed on store experience and own-brand ranges.",
  challenge:
    "Like-for-like store sales have fallen 4% year on year as online-first competitors take share. The board must decide whether to accelerate the e-commerce build-out or defend and modernise the store estate, with limited capital for both.",
  exhibits: [
    { title: "3-year financial summary", content: "| Metric | FY23 | FY24 | FY25 |\n| Revenue (£m) | 445 | 432 | 420 |\n| EBITDA (£m) | 38 | 31 | 26 |" },
    { title: "Channel mix", content: "| Channel | Share | YoY |\n| Stores | 78% | -6% |\n| Online | 22% | +18% |" },
    { title: "Customer NPS", content: "| Segment | NPS |\n| In-store | 24 |\n| Online | 41 |" },
  ],
  task: "Acting as an analyst advising the board, write a 12-minute recommendation on where Northwind should invest in FY26.",
  question: "Should Northwind prioritise its e-commerce build-out or its store estate, and why?",
  guidance: ["Structure with an issue tree", "Lead with the recommendation", "Quantify using two exhibits", "Name the biggest risk", "Commit to a position"],
};

const MOCK_AC_SCORE = {
  scores: { structure: 8, analysis: 8, recommendations: 7, commercialAwareness: 8, communication: 8 },
  overall: 8,
  commentary: "A well-structured response with clear analysis and a defensible, evidence-backed recommendation.",
  strengths: ["Clear structure", "Used the exhibits", "Quantified the recommendation"],
  improvements: ["Tie back to commercial impact", "Address one more risk", "Sharpen the executive summary"],
  modelAnswer: "An excellent response opens with a one-line recommendation, supports it with two exhibits, quantifies the upside, and names the key risk and mitigation.",
};

// Assessment-centre stage 2 (interview → presentation brief) and stage 3
// (presentation scoring → final report). Kept marker-clean: when these get
// embedded into later-stage prompts they must not trip an earlier matcher.
const MOCK_AC_BRIEF = {
  topic: "Launching a new own-brand product line into a competitive market",
  audience: "The senior leadership team",
  context:
    "The business wants to grow margin by expanding its own-brand range but faces strong incumbents and a limited marketing budget. Set out the case.",
  format: "3-minute spoken presentation",
  objectives: ["Make a clear recommendation", "Support it with evidence", "Set out the main risk and mitigation"],
  timeMinutes: 3,
};

const MOCK_PRESENTATION_SCORE = {
  scores: { structure: 8, content: 8, persuasion: 7, clarity: 8, delivery: 7 },
  overall: 8,
  commentary: "A clear, well-organised presentation with a defensible recommendation and good use of evidence.",
  strengths: ["Clear structure", "Confident delivery", "Evidence-backed recommendation"],
  improvements: ["Sharpen the opening", "Quantify the upside", "Name the key risk earlier"],
};

const MOCK_AC_REPORT = {
  overallScore: 8,
  readinessLevel: "High",
  headline: "A well-rounded candidate who performs consistently across all assessment centre stages.",
  competencyScores: { analyticalThinking: 8, communication: 8, commercialAwareness: 8, leadership: 7, problemSolving: 8 },
  stageScores: { caseStudy: 8, interview: 8, presentation: 8 },
  topStrengths: ["Structured analysis", "Clear communication", "Commercial judgement"],
  priorityImprovements: ["Deeper risk analysis", "More quantified outcomes", "Stronger executive summaries"],
  sevenDayPlan: [
    "Review an issue-tree framework",
    "Practise STAR answers with a timer",
    "Record and review a 3-minute presentation",
    "Read one sector report",
    "Write five strong STAR stories",
    "Do a mock interview",
    "Set three specific goals",
  ],
  finalRecommendation: "A strong candidate who is assessment-centre ready and would benefit from polishing executive communication.",
};

// /tools/star-scorer — schema matches the route's ScorerResult exactly.
const MOCK_STAR_SCORE = {
  situation: { score: 8, feedback: "Clear, concise context." },
  task: { score: 8, feedback: "Well-defined objective." },
  action: { score: 8, feedback: "Specific, owned actions." },
  result: { score: 8, feedback: "Quantified, relevant outcome." },
  overall: 8,
  summary: "A strong STAR answer with a clear, measurable result.",
  topImprovement: "Lead with the result to hook the interviewer.",
};

// Career-doc generators (Professional). Each fixture matches its route's schema.
const MOCK_PERSONAL_STATEMENT = {
  statement:
    "When I automated my school library's returns desk at sixteen, I learned that the best technology disappears into the problem it solves.\n\nThat conviction has shaped every step since.",
  wordCount: 480,
  openingHook: "Opens on a specific, concrete moment rather than a generic passion statement.",
  keyNarrativeThread: "Using technology to solve real, human problems.",
  strengths: ["Specific opening hook", "Coherent narrative arc", "Authentic, personal voice"],
  suggestions: ["Add one more quantified achievement", "Name specific programme modules", "Tighten the closing sentence"],
};

const MOCK_COVER_LETTER = {
  letter:
    "Dear Hiring Manager,\n\nWhen I saw how your team rebuilt the analytics stack last year, I recognised the kind of problem I want to work on.\n\nI would welcome the chance to discuss how I can help.",
  wordCount: 320,
  subject: "Application for Data Analyst: retail analytics experience",
  keyThemes: ["Commercial impact", "Technical fluency", "Genuine fit"],
  customisationTips: ["Name a specific recent initiative", "Mirror two phrases from the advert", "Add one quantified win"],
};

const MOCK_CV_ENHANCER = {
  overallScore: 7,
  overallLabel: "A solid CV with clear room to sharpen impact.",
  summary: "Strong experience that is undersold by vague bullets. Quantify outcomes and lead with impact.",
  sections: [
    { name: "Work Experience", score: 7, feedback: "Good roles, but bullets describe duties, not impact.", suggestion: "Rewrite each as action + scope + measurable result." },
    { name: "Skills", score: 6, feedback: "A flat keyword list.", suggestion: "Group by theme and tie each to evidence." },
  ],
  quickWins: ["Add metrics to the top three bullets", "Move skills below experience", "Cut the generic profile statement"],
  enhancedBullets: [
    { original: "Responsible for managing the team.", enhanced: "Led a 6-person team to deliver the roadmap two weeks early, lifting retention 12%." },
    { original: "Worked on dashboards.", enhanced: "Built four exec dashboards in SQL that informed weekly pricing decisions." },
  ],
  missingKeywords: ["A/B testing", "stakeholder management", "roadmapping", "SQL", "experimentation"],
  atsTips: ["Use a single-column layout", "Match the advert's exact job title", "Avoid tables and text boxes"],
  topStrength: "Genuine end-to-end product ownership across the lifecycle.",
  biggestGap: "No quantified outcomes: impact is invisible to a skim-reader.",
};

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

  // ── Assessment-centre chain. ORDER MATTERS: a later stage's prompt embeds the
  // earlier stages' JSON outputs, so each is matched by a marker unique to the
  // schema IT asks the model to RETURN, most-specific first.
  //
  // Final REPORT (chief assessor; stage-2 no-stage3 path and stage 3) —
  // "sevenDayPlan" is unique to the report schema. First, because the report
  // prompt also embeds the presentation feedback ("persuasion") and the case
  // feedback ("commercialAwareness").
  if (all.includes("sevenDayPlan")) {
    return JSON.stringify(MOCK_AC_REPORT);
  }
  // Presentation SCORING (submit-presentation) — "persuasion" is unique to its
  // score schema. Before the brief: the score prompt embeds the stored brief
  // (which contains "3-minute spoken presentation").
  if (all.includes('"persuasion"')) {
    return JSON.stringify(MOCK_PRESENTATION_SCORE);
  }
  // Presentation BRIEF generation (submit-interview, stage-3 path).
  if (all.includes("Generate a presentation brief")) {
    return JSON.stringify(MOCK_AC_BRIEF);
  }
  // Case-study SCORING (submit-case-study) — distinctive "commercialAwareness".
  // Before the scenario case (the scoring prompt embeds the scenario's "exhibits").
  if (all.includes("commercialAwareness")) {
    return JSON.stringify(MOCK_AC_SCORE);
  }
  // Case-study SCENARIO (start-ac) — distinctive "exhibits".
  if (all.includes('"exhibits"') || all.includes("assessment centre designer")) {
    return JSON.stringify(MOCK_AC_SCENARIO);
  }

  // Career-doc generators — each keyed off a field unique to its JSON schema.
  if (all.includes("openingHook")) {
    return JSON.stringify(MOCK_PERSONAL_STATEMENT);
  }
  if (all.includes("customisationTips")) {
    return JSON.stringify(MOCK_COVER_LETTER);
  }
  if (all.includes("enhancedBullets")) {
    return JSON.stringify(MOCK_CV_ENHANCER);
  }

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

  // /tools/star-scorer — distinctive STAR scoring prompt (STAR + score schema).
  if (all.includes("STAR") && all.includes("score")) {
    return JSON.stringify(MOCK_STAR_SCORE);
  }

  // /clean-transcript — best-effort echo.
  if (sys.includes("transcript") || all.toLowerCase().includes("clean")) {
    return JSON.stringify({ cleaned: "This is a cleaned interview transcript." });
  }

  // Benign default for any other callOpenAIChat caller in mock mode.
  return JSON.stringify({ ok: true });
}
