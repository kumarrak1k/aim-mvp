import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { STARScorerClient } from "./StarScorerClient";

export const metadata: Metadata = createPageMetadata({
  path: "/tools/star-scorer",
  title: "Free STAR Answer Scorer — Instant AI Feedback | AI Career Mentor",
  description:
    "Free AI-powered STAR answer scorer. No sign-in required. Paste your answer and get instant feedback on Situation, Task, Action, and Result.",
});

export default function STARScorerPage() {
  return <STARScorerClient />;
}
