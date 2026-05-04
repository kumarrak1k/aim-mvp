import type { Metadata } from "next";
import { createPageMetadata } from "@/app/config/seo";
import { CandidateProfileClient } from "./components/CandidateProfileClient";

export const metadata: Metadata = createPageMetadata({
  path: "/profile",
  title: "Candidate Profile Builder",
  description:
    "Build your AI Career Mentor candidate profile with CV context, target role details and interview goals for more tailored mock interviews.",
  keywords: [
    "candidate profile builder",
    "AI interview profile",
    "CV interview preparation",
    "role specific interview practice",
    "personalised mock interview",
  ],
});

export default function CandidateProfilePage() {
  return <CandidateProfileClient />;
}