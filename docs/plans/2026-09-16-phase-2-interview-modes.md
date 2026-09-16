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

Mode labels stay generic: "Traditional interview" and "One-way video interview".

**Decided 16 September 2026 (Rakesh): the product names no platform at all.** The earlier plan allowed explanatory copy to say "such as HireVue, Sonru and Spark Hire" with a disclaimer. It does not. The setup screen says "employer video interview platforms" and carries the independence note: AI Career Mentor is not affiliated with, endorsed by or connected to any of them, and does not reproduce any platform's own scoring. Nothing in the product needs a solicitor's review as a result.

This covers the product. Editorial content that describes the format for readers — the async video interview guide, and the company process guides that state which platform a named employer uses — names them descriptively, which is ordinary nominative use and carries SEO value. Anything new that names a platform in a mode name, a product name or ad copy still needs a solicitor first.

## Commits

1. **Config and setup** — schema column, `PracticeSessionConfig.interviewFormat` plus video settings, validation, setup UI with the two format cards and the settings, saved as the profile default.
2. **Session runtime** — a one-way video workspace: preparation countdown, automatic recording, large camera, answer timer, no transcript, optional retake. Reuses the existing camera and microphone hooks.
3. **Deferred feedback** — results held to the end by default, progress shown as "Question 3 of 6", the end report unchanged; per-answer feedback still available as an option.
4. **Onboarding and mid-session switching** — the question at onboarding, the stored default, and the in-session switch.
5. **Copy, disclaimer and the .com mirror** — including French, German and Spanish for the new strings.

## Status

- **Commit 1 — config and setup: done** (.co.uk 2998840, .com 37fe188). Format cards and recording settings on the setup screen, `UserProfile.preferredInterviewFormat` on all three databases, config carried through sessionStorage.
- **Commit 2 — session runtime: done** (.co.uk 62fbda8). `app/practice/session/oneWayVideo.ts` holds the clock as pure functions; `OneWayVideoStage` replaces the answer workspace and the camera thumbnail.
- **Commit 3 — deferred feedback: done as part of 2.** Per-answer scoring still runs, because progress saving and the end report depend on it; what is deferred is the display. The feedback panel is hidden in a one-way interview unless the candidate chose "feedback after every answer", and the stage shows "Question 3 of 6" instead.
- **Commit 4 — onboarding and switching: done.** The format is asked once in the equipment check, at the moment the candidate is looking at their own camera preview, and stored as the profile default. Either format can be switched mid-session; the switch lands at the next question so the answer in progress is never thrown away.
- **Commit 5 — copy and the .com mirror: partly done.** The independence note is on the .co.uk setup screen. The .com setup UI and its French, German and Spanish strings are **deferred while .com is parked** (307 to .co.uk): it has the plumbing, the databases and the shared library, so the mirror is a UI-and-translation job to do when .com is unparked.

Answered 16 September: the copy names no platform. See Naming and legal above.

## Things that will bite

- **iOS needs a gesture before audio or camera.** The first recording is covered by the Start tap. Later auto-starts can be blocked, so each question falls back to a single "Start recording" tap rather than failing silently. The existing auto-flow already solves this for voice mode; reuse it.
- **Phones are the likely device** for this format. The camera view has to work in portrait with the timer visible, and nothing important may sit under the iOS home bar.
- **A hard answer limit can cut someone off mid-sentence.** The timer warns at 30 seconds, and the answer is submitted rather than discarded when it runs out.
- **No transcript on screen** is deliberate, but the transcript still exists for scoring. The end report shows it, which is where the coaching value comes back.
- **Assessment centre and company assessments keep the traditional format.** A recruiter-set assessment must stay comparable between candidates.
