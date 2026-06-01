/**
 * The remaining standalone AI / analysis routes, driven at the API level:
 *   - /api/tools/star-scorer        (callOpenAIChat → mock seam)
 *   - /api/clean-transcript         (OpenAI SDK direct → in-route mock guard)
 *   - /api/voice-analysis           (pure heuristics, no AI)
 *   - /api/video-analysis           (pure math, no AI)
 *   - /api/whisper-filler           (plan-gated; free → 403 — see the note below)
 * Deterministic under AIM_TEST_MODE=mock. star-scorer is also @real-ai (its JSON
 * parser is worth checking against the live model on the nightly).
 *
 * Limitation: routes that gate on the JWT `metadata` claim
 * (resolveCandidatePlanFromClaims) can only be asserted for the REJECT case —
 * @clerk/testing's seeded session tokens don't surface private_metadata to a
 * route handler. The paid-PASS resolution is covered by the unit matrix.
 */
import { test, expect } from "@playwright/test";
import { statePath } from "../fixtures/env";

test.describe("AI + analysis routes", () => {
  test.describe("free persona", () => {
    test.use({ storageState: statePath("free") });

    test("star-scorer returns a STAR breakdown", { tag: "@real-ai" }, async ({ page }) => {
      const res = await page.request.post("/api/tools/star-scorer", {
        data: {
          role: "Graduate software engineer",
          question: "Tell me about a challenge you overcame.",
          answer:
            "In my final-year project I was tasked with cutting report turnaround. I redesigned the data pipeline and automated the validation checks, which cut turnaround by 40% and was adopted across the team.",
        },
      });
      expect(res.status(), await res.text()).toBe(200);
      const body = await res.json();
      expect(typeof body.overall).toBe("number");
      expect(typeof body.situation.score).toBe("number");
      expect(typeof body.topImprovement).toBe("string");
    });

    test("clean-transcript returns UK-normalised text", async ({ page }) => {
      const res = await page.request.post("/api/clean-transcript", {
        data: { transcript: "I will organize the analysis and optimize the behavior of the organization." },
      });
      expect(res.status(), await res.text()).toBe(200);
      const { cleanedTranscript } = await res.json();
      expect(cleanedTranscript).toContain("organise");
      expect(cleanedTranscript).toContain("optimise");
      expect(cleanedTranscript).toContain("behaviour");
    });

    test("voice-analysis scores a transcript and detects fillers", async ({ page }) => {
      const res = await page.request.post("/api/voice-analysis", {
        data: {
          transcript:
            "Um, so basically I led the team, you know, and uh delivered the project. For example, I managed the rollout and the result was a 30% improvement.",
          durationSeconds: 30,
        },
      });
      expect(res.status(), await res.text()).toBe(200);
      const body = await res.json();
      expect(typeof body.overallVoiceScore).toBe("number");
      expect(body.metrics.wordCount).toBeGreaterThan(0);
      expect(body.evidence.fillersDetected).toContain("um");
    });

    test("video-analysis scores camera metrics", async ({ page }) => {
      const res = await page.request.post("/api/video-analysis", {
        data: {
          metrics: {
            faceDetectedRatio: 0.92, centeredFaceRatio: 0.88, lookingForwardRatio: 0.85,
            postureStabilityScore: 0.8, engagementRatio: 0.8, expressionScore: 0.7,
            smileRatio: 0.12, excessiveMovementScore: 0.8, faceLossEvents: 0, totalFrames: 120,
          },
        },
      });
      expect(res.status(), await res.text()).toBe(200);
      const body = await res.json();
      expect(typeof body.overallVideoScore).toBe("number");
      expect(body.overallVideoScore).toBeGreaterThan(0);
      expect(typeof body.eyeContactScore).toBe("number");
    });

    test("whisper-filler is gated to paid plans (free → 403)", async ({ page }) => {
      const res = await page.request.post("/api/whisper-filler", {
        multipart: { audio: { name: "answer.webm", mimeType: "audio/webm", buffer: Buffer.alloc(200) } },
      });
      expect(res.status()).toBe(403);
    });

    // NOTE: the paid PASS of this gate isn't asserted here. whisper-filler hard-
    // gates on plan.isUnlimited read from the JWT `metadata` claim, and
    // @clerk/testing's seeded session tokens don't surface private_metadata to a
    // route handler (a route handler sees userId but no metadata → a false 403).
    // The resolver is locked by tests/unit/candidatePlan.persona.test.ts
    // (plus/professional/trial → unlimited), so the rejection above is the part
    // worth an E2E check. In production the session-token metadata claim is
    // present (GO-LIVE §0), so real paid users are admitted.
  });
});
