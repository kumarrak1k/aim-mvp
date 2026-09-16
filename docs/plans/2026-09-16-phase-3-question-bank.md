# Phase 3: the question bank

Agreed with Rakesh 15 September 2026, built 16 September. Follows Phase 0 (measure), Phase 1 (stop losing people mid-interview) and Phase 2 (two interview formats), all live.

## Why

Rakesh's users told him our questions are not the ones they actually get asked. Every question today is written fresh by the model from a type instruction, so each one is plausible and none is standard. A graduate who practises here and then sits a real first round meets a different set of questions, which is the opposite of preparation.

The fix is not a better prompt. It is a bank of the questions employers really ask, tagged well enough to build a realistic session out of, with the model kept for the one or two questions that should come from the candidate's own CV and job description.

## What a session looks like

A real graduate screen has a shape: an opener, why us, two or three competency questions, something situational or strengths-based, and often one commercial question. Our blueprint mirrors that, scaled to the question count the candidate chose:

- Question 1 is always the opener.
- Question 2 is motivation ("why this role", "why us").
- The middle is competency, with a situational or strengths question mixed in.
- One slot per session is **tailored**: written by the model from the candidate's CV and role spec, because that is the question a bank cannot hold.
- Longer sessions add commercial awareness and, where the role warrants it, technical.

A candidate who sets their own question mix (a Pro control) keeps it. The blueprint is what happens when nobody has asked for anything specific, which is almost everyone.

## The bank

`app/lib/questionBank/` holds the questions as typed data in the repo, not in a database: they are version-controlled, reviewable in a diff, identical on both sites, and need no migration. User-reported questions, when they come, can merge in from the database later.

Each question carries:
- `type` — opener, motivation, competency, strengths, situational, commercial, technical, leadership. The same vocabulary as the question mix.
- `competency` — teamwork, resilience, conflict, failure, problem solving, communication, organisation, initiative, adaptability, ethics, customer focus. Lets a session cover different ground rather than asking about teamwork three times.
- `sectors` — omitted means it suits any sector. A sector layer sits on top of the core.
- `levels` — early, graduate, experienced. A question about managing a team is wrong for a school leaver.
- `source` — where it came from, for attribution and for the licence audit.

## Sourcing rules (unchanged, and they bind)

Questions are **written by us from common patterns**. We do not scrape Glassdoor, Indeed or Reddit, and we do not copy curated lists. Civil Service Success Profiles material is Open Government Licence v3 and may be reused commercially **with attribution**, which the bank records per question. Copy never claims these are real questions from a named employer.

## Selection

Within a type, the bank is filtered to what fits the sector and level, then anything already asked is removed: in this session, and in the candidate's recent sessions, which the interview route already loads. What is left is picked with the attempt id as the seed, so the order is stable if a question is re-fetched but different next time.

If the bank runs dry for a type (a narrow sector, a long session, a heavy user), the model writes the question as it does today. The bank is the default, not a cage.

## Commits

1. **The bank and its rules** — data, tags, filtering, the no-repeats rule, all pure and unit-tested.
2. **The blueprint** — session shapes by question count, the tailored slot, and the switch from mix-flattening to blueprint when no custom mix is set.
3. **Wiring** — `/api/interview` answers from the bank where it can and calls the model where it cannot, keeping the existing contract so nothing downstream changes.
4. **The .com mirror** — the bank is server-side, so this is a straight copy with no translation work.

## Things that will bite

- **A bank question must never arrive twice in one session.** The route already collects recent questions for the anti-repetition prompt; the same list now filters the bank.
- **Sector tags must not narrow the pool to nothing.** Sector-specific questions are a layer on top of the core, never a replacement, so every filter falls back to the untagged core.
- **The model answer and scoring pipeline are untouched.** A bank question goes through `/api/feedback` exactly as a generated one does.
- **Assessment centres and company assessments** keep their recruiter-set mix; the bank fills their slots too, but the blueprint never overrides a mix a recruiter chose.
- **UK English.** The bank is checked for the same Americanisms the generated questions are normalised for.
