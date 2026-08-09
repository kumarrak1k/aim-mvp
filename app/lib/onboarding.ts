/**
 * Candidate onboarding — content and personalisation.
 *
 * Five steps: three ask, one gives something back, one launches. The general
 * shape (ask, then repay before requesting effort) is ordinary onboarding
 * practice. The content deliberately is not borrowed: the questions are built
 * around what THIS product measures and offers, which is a different set from
 * anyone else's.
 *
 * Two things make it ours rather than a copy:
 *
 *  - Step 2 asks what KIND of process the candidate faces — interview,
 *    assessment centre, or unsure. No competitor reviewed can ask that,
 *    because none of them runs a three-stage assessment centre. It also
 *    changes where the candidate lands at the end.
 *  - Step 3's options map onto the five categories the scorer actually
 *    reports (content, clarity, relevance, structure, confidence), so an
 *    answer moves a real dial rather than being stored and forgotten.
 *
 * The order matters. Asking four questions and then dropping someone on an
 * empty practice screen is what happens today, and every profile in the
 * database is blank as a result — nothing ever asked, so nothing was filled in.
 */

export const CAREER_STAGES = [
  { value: "Apprentice", label: "Apprenticeship", hint: "Level 3 to 7" },
  { value: "Graduate / entry level", label: "Graduate or first role", hint: "Scheme, or starting out" },
  { value: "Early career", label: "A few years in", hint: "Moving up, or moving across" },
  { value: "Experienced", label: "Experienced hire", hint: "Senior or specialist" },
] as const;

/**
 * Common target roles, offered as a picker beside the free-text box.
 *
 * Not a closed list and never validated against — the text field remains the
 * source of truth, because the whole point of asking is to catch the role we
 * did not think of. This exists for the candidate who knows the sector but
 * hasn't settled on a job title, where a blank box invites a vague answer and
 * vague answers produce vague questions.
 *
 * Grouped by sector so the list stays scannable as it grows.
 */
export const TARGET_ROLE_SUGGESTIONS = [
  {
    group: "Graduate schemes",
    roles: [
      "Graduate Software Engineer",
      "Graduate Analyst",
      "Graduate Consultant",
      "Graduate Trainee Manager",
    ],
  },
  {
    group: "Finance & professional services",
    roles: [
      "Investment Banking Analyst",
      "Audit Associate",
      "Tax Associate",
      "Management Consultant",
      "Trainee Solicitor",
    ],
  },
  {
    group: "Technology & data",
    roles: [
      "Software Engineer",
      "Data Analyst",
      "Data Scientist",
      "Product Manager",
      "Cyber Security Analyst",
    ],
  },
  {
    group: "Business & operations",
    roles: [
      "Operations Analyst",
      "Project Manager",
      "Business Analyst",
      "Marketing Executive",
      "HR Advisor",
    ],
  },
  {
    group: "Public sector, health & education",
    roles: [
      "Civil Service Fast Streamer",
      "NHS Graduate Trainee",
      "Teacher",
      "Policy Adviser",
    ],
  },
] as const;

/**
 * Broader than a graduate-scheme list. This product also serves career
 * changers and experienced hires, so a finance-and-consulting-heavy list would
 * misrepresent who it is for.
 */
export const SECTORS = [
  "Financial services",
  "Technology & data",
  "Public sector & education",
  "Healthcare & life sciences",
  "Legal & professional services",
  "Engineering & manufacturing",
  "Retail, media & hospitality",
  "Charity & social impact",
  "Still deciding",
] as const;

/**
 * What the candidate is actually facing. This is ours to ask because the
 * product runs full assessment centres; it also decides where step 5 sends
 * them, so it is a routing question, not a survey question.
 */
export const PROCESS_TYPES = [
  {
    value: "interview",
    label: "A competency interview",
    hint: "Questions about your experience",
    destination: "/practice",
  },
  {
    value: "assessment-centre",
    label: "An assessment centre",
    hint: "Case study, interview and presentation",
    destination: "/assessment-centre",
  },
  {
    // Many graduate and corporate processes run both stages. Capturing that
    // here lets the plan (step 4) set up the interview-first path AND plant
    // the assessment centre — which is where Professional earns its keep.
    value: "both",
    label: "Both — an interview and an assessment centre",
    hint: "Interview first, then the full centre",
    destination: "/practice",
  },
  {
    value: "unsure",
    label: "I have not been told yet",
    hint: "We will start you on the basics",
    destination: "/practice",
  },
] as const;

export type ProcessTypeValue = (typeof PROCESS_TYPES)[number]["value"];

export function processTypeFor(value: string | null | undefined) {
  return PROCESS_TYPES.find((p) => p.value === value) ?? null;
}

/**
 * Improvement areas, each tied to a category the scorer genuinely reports.
 * Phrased as the complaint a candidate would actually make out loud, but in
 * this product's register — plain, British, unsentimental.
 */
export const CHALLENGES = [
  {
    value: "wander",
    label: "My answers wander off the question",
    echo: "find your answers wander",
    focusArea: "Structure (STAR)",
    coaching: "getting to the point early and finishing on a result",
  },
  {
    value: "thin",
    label: "I run out of things to say",
    echo: "run short of things to say",
    focusArea: "Content & evidence",
    coaching: "building examples out of study, projects and part-time work",
  },
  {
    value: "blank",
    label: "I go blank when I am put on the spot",
    echo: "go blank under pressure",
    focusArea: "Confidence & delivery",
    coaching: "opening lines you can reach for when your mind empties",
  },
  {
    value: "flat",
    label: "I come across flat on camera",
    echo: "come across flat on camera",
    focusArea: "Confidence & delivery",
    coaching: "pace, pauses and presence on video",
  },
  {
    value: "unsure-quality",
    label: "I cannot tell whether an answer was any good",
    echo: "cannot tell a good answer from a weak one",
    focusArea: "Balanced",
    coaching: "scoring against the same criteria an assessor uses",
  },
  {
    value: "black-box",
    label: "I have little to no experience with Assessment Centres",
    echo: "have little to no experience with assessment centres",
    focusArea: "Balanced",
    coaching: "walking the full case study, interview and presentation format",
  },
] as const;

export type ChallengeValue = (typeof CHALLENGES)[number]["value"];

export function challengeFor(value: string | null | undefined) {
  return CHALLENGES.find((c) => c.value === value) ?? null;
}

/**
 * The step-4 payoff — the reason the earlier steps do not read as a form. It
 * repeats the candidate's own answers back and commits to acting on them.
 *
 * Deliberately specific. "We've personalised your experience" is filler, and
 * teaches the user their answers went nowhere.
 */
export function buildPlanIntro(input: {
  role: string;
  sector: string;
  stage: string;
  challenge: string | null;
}): { headline: string; body: string } {
  const c = challengeFor(input.challenge);
  const role = input.role.trim() || "your target role";
  const stageLabel =
    CAREER_STAGES.find((s) => s.value === input.stage)?.label.toLowerCase() ?? "candidate";

  if (!c) {
    return {
      headline: `Here is how we will prepare you for ${role}.`,
      body: `Questions written for ${input.sector.toLowerCase()}, pitched at ${stageLabel}, and scored the way an assessor would score them.`,
    };
  }

  return {
    headline: `We will build your practice around one thing first.`,
    body: `You said you ${c.echo}. Sessions will lean on ${c.coaching}, using questions written for ${role} in ${input.sector.toLowerCase()}.`,
  };
}

/** The three-step path shown at step 4. Concrete, and tied to the answers. */
export function buildPlanSteps(
  challenge: string | null,
  processType: string | null
): Array<{ title: string; body: string }> {
  const c = challengeFor(challenge);
  const p = processTypeFor(processType);

  return [
    {
      title: "A short first session",
      body: "Three questions instead of five. Scored the same way, so you finish with a real starting point rather than an empty chart.",
    },
    {
      title: c ? `Then we work on ${c.focusArea.toLowerCase()}` : "Then full sessions",
      body: c
        ? `Weighted toward ${c.coaching}.`
        : "Five questions across the competencies you are most likely to be asked about.",
    },
    p?.value === "assessment-centre"
      ? {
          title: "Then the full assessment centre",
          body: "Written case study against the clock, competency interview, and a presentation — scored stage by stage.",
        }
      : p?.value === "both"
        ? {
            // Facing both stages: interview practice comes first, and the
            // centre is named now so the candidate knows where this is going
            // (and which plan covers it) before the invite email lands.
            title: "Then the full assessment centre",
            body: "Once your answers are landing, run the complete centre — case study, interview and presentation, scored stage by stage. Available on the Professional plan when you are ready.",
          }
        : {
            title: "Then watch the trend",
            body: "Every session is saved. The number worth watching is whether it is moving, not any single score.",
          },
  ];
}

/** Total steps, used for the progress indicator. */
export const ONBOARDING_STEPS = 6;
