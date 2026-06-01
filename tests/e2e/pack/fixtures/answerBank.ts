/**
 * The "simulated candidate"'s answers.
 *
 * Each entry is a genuinely STAR-structured answer (Situation, Task, Action,
 * Result with a quantified outcome), 120–180 words so content/structure scoring
 * behaves realistically. answerFor() matches the on-screen question's intent and
 * falls back to a strong default — so the bot stays robust even when it can't
 * read the exact question text.
 *
 * To swap in LLM-generated answers later (the `@real-ai` nightly run), replace
 * answerFor with a call to your own model keyed on the question + role.
 */

const DEFAULT_STAR =
  "In my final-year group project (Situation), I was made responsible for delivering a data dashboard the rest of the team depended on (Task). The original pipeline was manual and error-prone, so I redesigned it, automated the validation checks and wrote clear documentation so others could maintain it (Action). As a result, report turnaround dropped by about 40%, we hit every milestone, and the approach was adopted by two other project groups the following term (Result). The experience taught me to focus on the outcome the work needs to enable, not just the task in front of me, and to make my work easy for others to build on.";

const BANK: Array<{ match: RegExp; answer: string }> = [
  {
    match: /tell me about yourself|introduce yourself|your background|walk me through/i,
    answer:
      "I'm a recent graduate with a strong interest in building reliable software that solves real problems. During my degree I focused on practical projects: in my final year I led the data layer of a team product (Situation/Task), where I designed the schema and automated our testing (Action), which cut our integration bugs to almost none and let us ship two weeks early (Result). Alongside that I interned at a small startup, where I learned to work directly with users and ship in small, safe increments. I'm drawn to this role because it combines that hands-on engineering with a clear product focus, and I'm keen to keep growing in a team that values quality and ownership.",
  },
  {
    match: /challenge|difficult|problem|obstacle|setback|under pressure/i,
    answer: DEFAULT_STAR,
  },
  {
    match: /conflict|disagree|colleague|difficult person|teammate/i,
    answer:
      "On a group project a teammate and I disagreed sharply on the architecture (Situation); we needed one approach to keep moving and the deadline was close (Task). Rather than argue in the abstract, I suggested we each write a one-page trade-off note and timebox a small spike to test the riskiest assumption (Action). The spike showed my colleague's concern about scaling was valid in one area but not the others, so we combined both ideas — their data model with my simpler API. We shipped on time, and more importantly the way we resolved it became how the team handled later disagreements (Result). I learned that turning a disagreement into a quick, testable question defuses it and produces a better answer than either of us had alone.",
  },
  {
    match: /strength|good at|best quality|excel/i,
    answer:
      "My biggest strength is turning ambiguous problems into a clear plan others can act on (Situation). On a recent project the brief was vague and the team was stalling (Task), so I broke it into a short list of concrete questions, mapped each to an owner, and set a one-week checkpoint (Action). Within that week we'd resolved the unknowns and had a working prototype, and the stakeholder commented that the project finally felt in control (Result). I get this from a habit of writing things down and making the next action obvious. I'd bring the same clarity here: I like to reduce uncertainty quickly so the team can spend its energy building rather than guessing.",
  },
  {
    match: /learn|new (skill|technology|tool)|quickly|adapt|outside your comfort/i,
    answer:
      "When my team adopted a framework I'd never used, two days before a client demo (Situation), I needed to be productive in it fast (Task). I spent the first evening building the smallest possible end-to-end example, then rebuilt one real feature from our app in it, taking notes on every sticking point (Action). By the demo I'd not only delivered my part but written a short guide that got two teammates up to speed in an hour (Result). I learned best by shipping something small and real rather than reading exhaustively first, and by turning my notes into something the team could reuse — which is how I'd approach any new tool here.",
  },
  {
    match: /led|leadership|team|manage|mentor|delegat/i,
    answer:
      "I led a four-person team for our capstone project (Situation), responsible for delivering a working product in eight weeks (Task). I set a simple weekly rhythm — plan on Monday, demo on Friday — gave each person an area they owned, and kept a visible list of risks (Action). When one teammate fell behind, I paired with them early rather than reassigning the work, which kept morale up and got us back on track. We delivered on time, scored the top mark in the cohort, and every member said they'd want to work together again (Result). I learned that good leadership is mostly about making the goal and the next step obvious, then removing blockers so people can do their best work.",
  },
];

/** Returns a STAR answer matched to the question's intent, or a strong default. */
export function answerFor(question: string): string {
  const hit = BANK.find((b) => b.match.test(question || ""));
  return hit ? hit.answer : DEFAULT_STAR;
}
