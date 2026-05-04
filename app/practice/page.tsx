import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { PracticePageClient } from "./components/PracticePageClient";

export const metadata: Metadata = createPageMetadata({
  path: "/practice",
  title: "AI Mock Interview Practice",
  description:
    "Start a tailored AI mock interview with answer feedback, voice delivery coaching, camera presence analysis and stronger model answers.",
  keywords: [
    "AI mock interview practice",
    "AI interview practice",
    "voice interview practice",
    "camera interview practice",
    "interview answer feedback",
    "practice interview questions",
  ],
});

export default function PracticePage() {
  return <PracticePageClient />;
}