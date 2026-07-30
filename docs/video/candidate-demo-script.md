# Candidate demo — script and shot list (.co.uk)

**Target length:** 75 seconds
**Aspect:** 16:9 master for the site. A 9:16 cut for ads is derived later via `reframe`.
**Voice:** British English, natural and warm. Not an announcer. See Voice direction below.
**Audience:** UK graduates, career changers and professionals with an interview booked.

The single job of this video is to move someone from "I have an interview and I feel
underprepared" to "I could practise this tonight". Everything below serves that.

---

## The strategic decision behind this script

The old demo shows what the product *is*. This one shows what the candidate's
*problem* is and lets the product resolve it. That is the difference between a tour
and an advert, and it is why the first eight seconds contain no interface at all.

The proof beat matters more than the feature list. Most interview products claim to
help; almost none show the specific, uncomfortable thing a user cannot see about
themselves. Filler words and rambling are exactly that, so they lead.

---

## Shot list

| # | Time | Source | Shot | On screen |
|---|---|---|---|---|
| 1 | 0.0–3.0 | **AI** | Close on a person at a kitchen table at night, laptop open, phone face-down. Still, not defeated. Warm lamp light, UK domestic interior. Slow push in. | — |
| 2 | 3.0–8.0 | **AI** | Same person mid-rehearsal to an empty room, mouth moving, hands gesturing, then stopping. Slight hesitation. | — |
| 3 | 8.0–14.0 | **CAPTURE** | `/practice` setup: target role typed, interview type and difficulty chosen. Cursor moves deliberately. | Role field being filled |
| 4 | 14.0–22.0 | **CAPTURE** | Live practice session, voice + camera mode. Question card visible, "Recording..." state, camera preview showing the user. | Question text legible |
| 5 | 22.0–32.0 | **CAPTURE** | Feedback panel: overall score, per-dimension bars, filler-word count, pace. Scroll slowly so numbers land. | Score + dimensions |
| 6 | 32.0–40.0 | **CAPTURE** | Assessment Centre setup → Stage 1 case study with the timer visible. | "12:00" timer |
| 7 | 40.0–48.0 | **CAPTURE** | Assessment Centre report: overall score, readiness level, stage breakdown. | Readiness level |
| 8 | 48.0–56.0 | **CAPTURE** | My Progress: score trend over several sessions, moving up. | Upward trend |
| 9 | 56.0–64.0 | **AI** | Same person from shot 1, different day, morning light, walking out of a front door in interview clothes. Composed, unhurried. | — |
| 10 | 64.0–75.0 | **CAPTURE** | Clean loop of the practice question card, then hold on logo + URL. | `aicareermentor.co.uk` |

**Six capture shots, four AI shots.** The AI shots carry the emotional arc; every
claim about the product is real footage. That split is deliberate — a demo that
fakes its own interface is both dishonest and obvious.

---

## Voiceover script

Timings are targets, not constraints. Read at a natural pace and let the visuals
breathe; if the read runs slightly long, extend the shot rather than rushing the line.

> **(0–3s)**
> "The interview's on Thursday. And you've read the guides, you've made the notes."
>
> **(3–8s)**
> "But you haven't actually said any of it out loud. Not once."
>
> **(8–14s)**
> "AI Career Mentor gives you somewhere to do that. Tell it the role you're going for,
> and it builds an interview around it."
>
> **(14–22s)**
> "Then you answer. Out loud, on camera, the way you will on the day."
>
> **(22–32s)**
> "And this is the part you can't do alone. It tells you where you rambled. How many
> times you said 'um'. Whether your answer actually had a result in it, or just
> stopped."
>
> **(32–40s)**
> "If you're facing an assessment centre, it runs the whole thing. Written case study,
> against the clock."
>
> **(40–48s)**
> "Interview. Presentation. Scored the way an assessor would score it."
>
> **(48–56s)**
> "And it keeps the history, so you can see the thing that's hardest to believe about
> yourself: that you're getting better."
>
> **(56–64s)**
> "Nobody walks in unshakeable. But there's a difference between hoping it goes well,
> and having already done it four times."
>
> **(64–75s)**
> "AI Career Mentor. Practise properly, before it counts."

**Word count:** ~185 words across 75 seconds. That is deliberately under the usual
160 wpm, because the pauses are doing work — particularly after "Not once."

---

## Voice direction

- **Accent:** British. Neutral-to-southern RP, or a light regional accent that reads
  as trustworthy rather than corporate. Avoid anything that sounds like a call centre.
- **Age:** 30s–40s. Old enough to have sat on both sides of an interview.
- **Tone:** Level and quiet. This script does not work if it is delivered with energy.
  The line "Not once" should land almost flat.
- **Pace:** Unhurried. Two full beats after "Not once", one beat before "AI Career Mentor".
- **What to avoid:** Rising inflection at line ends, salesy warmth, over-enunciation.
  The read should sound like someone explaining something to a friend who is worried.

---

## Screen capture requirements

Record at **1920×1080, 60fps**, browser chrome hidden, on a clean signed-in account
with realistic data. Details that matter:

- Use a plausible target role, not "test". Suggest "Graduate Analyst".
- The feedback panel must show a **realistic score, not a perfect one.** A 7 is more
  persuasive than a 10, and it matches the recalibrated scoring.
- Progress chart needs **at least four sessions** with genuine variation — an upward
  line with a dip in it is more credible than a straight climb.
- Move the cursor deliberately and slightly slower than feels natural. Fast cursor
  movement reads as frantic on video.
- No real personal data, no real company names in any visible field.

---

## AI generation notes (shots 1, 2, 9)

Generate **stills first** to lock the look, then animate only the approved frame. Stills
are seconds and cheap; video is minutes and expensive.

Consistency across shots 1, 2 and 9 is the whole ballgame — it must read as the same
person on two different days. Use `show_reference_elements` to pin the character from
the first approved still, then reference it in the others.

**Look:** UK domestic, believable rather than aspirational. Slightly cluttered kitchen,
not a styled set. Warm practical lighting at night, cool daylight for shot 9. Shallow
depth of field. No stock-footage gloss and no visible branding.

**Casting:** deliberately unspecified. Pick someone who reads as an ordinary UK
graduate or early-career professional rather than a model.

---

## Build order

1. Record the six capture shots. **This gates everything** and costs no credits.
2. Generate stills for shots 1, 2, 9. Iterate here until the person and the mood are right.
3. Pin the character with `show_reference_elements`.
4. Animate the three approved frames.
5. Record the voiceover, or generate it with TTS and a British voice.
6. Assemble with `explainer_video`, then `virality_predictor` on the cut.
7. Derive the 9:16 ad cut with `reframe`.

Steps 1 and 2 are where the quality is decided. Step 4 is where the credits go, so
nothing should be animated that has not been approved as a still.
