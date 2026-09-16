# Phase 2: two interview formats

Agreed with Rakesh 15 to 16 September 2026. Follows Phase 0 (measure) and Phase 1 (stop losing people mid-interview), which are live.

## Why

The 18 to 25 audience mostly meets a one-way video interview first: a question appears, a countdown runs while you think, then a large camera view records you answering, with no transcript and no feedback until later. Our product only offers a coaching flow: question, your answer, feedback after every answer. It is useful practice but it is not what they are about to sit, so it does not feel like preparation for the real thing.

## The two formats

**Traditional interview** (what exists today). Question, your answer typed or spoken, scored feedback and a model answer after each one. The coaching flow, unchanged.

**One-way video interview** (new). Per question:
1. Question on screen with a preparation countdown, default 60 seconds, with an "I'm ready" button to start early.
2. Recording starts on its own. Large camera view of the candidate. No live transcript.
3. An answer timer, default 2 minutes, with the last 30 seconds marked. Submitting early is allowed.
4. No feedback between questions by default. The full report comes at the end.

Settings offered at setup, with realistic defaults rather than a wall of choices:
- Preparation: 30s, 60s (default), 90s
- Answer limit: 1, 2 (default) or 3 minutes
- Retakes: none (default) or one per question
- Feedback: at the end (default) or after each answer

Answers are still transcribed and scored exactly as now, so progress saving, the usage cap and the end report all work unchanged. The difference is what the candidate sees while answering.

## Where the choice lives

- **Practice setup**: a format choice above the answer-mode block. Choosing one-way video implies voice and camera.
- **Onboarding**: asked once, stored as the default, and changeable later (Rakesh: "ask them and allow them to change later").
- **During a session**: switchable, since the two formats suit different moods. Switching applies from the next question and never discards saved answers.
- **Stored default**: `UserProfile.preferredInterviewFormat`, additive column, default `traditional`.

## Naming and legal

Mode labels stay generic: "Traditional interview" and "One-way video interview". Explanatory copy may say "the format used by employer platforms such as HireVue, Sonru and Spark Hire", with the disclaimer that those are trade marks of their owners and AI Career Mentor is independent, not affiliated or endorsed, and simulates the general format rather than any platform's scoring. The platform names never appear in a mode name, a product name or ad copy without a solicitor's review.

## Commits

1. **Config and setup** — schema column, `PracticeSessionConfig.interviewFormat` plus video settings, validation, setup UI with the two format cards and the settings, saved as the profile default.
2. **Session runtime** — a one-way video workspace: preparation countdown, automatic recording, large camera, answer timer, no transcript, optional retake. Reuses the existing camera and microphone hooks.
3. **Deferred feedback** — results held to the end by default, progress shown as "Question 3 of 6", the end report unchanged; per-answer feedback still available as an option.
4. **Onboarding and mid-session switching** — the question at onboarding, the stored default, and the in-session switch.
5. **Copy, disclaimer and the .com mirror** — including French, German and Spanish for the new strings.

## Things that will bite

- **iOS needs a gesture before audio or camera.** The first recording is covered by the Start tap. Later auto-starts can be blocked, so each question falls back to a single "Start recording" tap rather than failing silently. The existing auto-flow already solves this for voice mode; reuse it.
- **Phones are the likely device** for this format. The camera view has to work in portrait with the timer visible, and nothing important may sit under the iOS home bar.
- **A hard answer limit can cut someone off mid-sentence.** The timer warns at 30 seconds, and the answer is submitted rather than discarded when it runs out.
- **No transcript on screen** is deliberate, but the transcript still exists for scoring. The end report shows it, which is where the coaching value comes back.
- **Assessment centre and company assessments keep the traditional format.** A recruiter-set assessment must stay comparable between candidates.
