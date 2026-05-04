"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import {
  GlassCard,
  MarketingShell,
  SectionHeading,
} from "../components/marketing/MarketingShell";

type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  updatedAt: string;
};

export default function CandidateProfilePage() {
  const { isLoaded, isSignedIn } = useUser();

  const [cvText, setCvText] = useState("");
  const [roleSpec, setRoleSpec] = useState("");
  const [interviewGoals, setInterviewGoals] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [roleSpecFileName, setRoleSpecFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extractingCv, setExtractingCv] = useState(false);
  const [extractingRole, setExtractingRole] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/candidate-profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!cancelled && res.ok && data.profile) {
          const profile = data.profile as CandidateProfile;
          setCvText(profile.cvText || "");
          setRoleSpec(profile.roleSpec || "");
          setInterviewGoals(profile.interviewGoals || "");
          setCvFileName(profile.cvFileName || "");
          setRoleSpecFileName(profile.roleSpecFileName || "");
        }
      } catch {
        if (!cancelled) {
          setStatusMessage("Unable to load your saved candidate profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const completionScore = useMemo(() => {
    let score = 0;
    if (cvText.trim()) score += 34;
    if (roleSpec.trim()) score += 33;
    if (interviewGoals.trim()) score += 33;
    return Math.min(100, score);
  }, [cvText, roleSpec, interviewGoals]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMessage("");

      const res = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText,
          roleSpec,
          interviewGoals,
          cvFileName,
          roleSpecFileName,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatusMessage(data.error || "Could not save candidate profile.");
        return;
      }

      setStatusMessage("Candidate profile saved successfully.");
    } catch {
      setStatusMessage("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  const extractDocumentText = async (
    file: File,
    target: "cv" | "roleSpec"
  ) => {
    try {
      if (target === "cv") setExtractingCv(true);
      if (target === "roleSpec") setExtractingRole(true);
      setStatusMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatusMessage(data.error || "Could not extract text from file.");
        return;
      }

      const extractedText =
        data.text || data.extractedText || data.content || "";

      if (target === "cv") {
        setCvText(extractedText || cvText);
        setCvFileName(file.name);
      } else {
        setRoleSpec(extractedText || roleSpec);
        setRoleSpecFileName(file.name);
      }

      setStatusMessage(`${file.name} processed successfully.`);
    } catch {
      setStatusMessage("File upload failed.");
    } finally {
      if (target === "cv") setExtractingCv(false);
      if (target === "roleSpec") setExtractingRole(false);
    }
  };

  return (
    <MarketingShell currentPath="/profile">
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionHeading
              eyebrow="Candidate Profile"
              title="Build your candidate profile once. Practise smarter every time."
              description="Save your CV content, target role specification and interview goals so each practice session feels more relevant, focused and personalised."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <ProfileMetric
                value={`${completionScore}%`}
                label="Profile completion"
              />
              <ProfileMetric
                value={cvText.trim() ? "Ready" : "Pending"}
                label="CV context"
              />
              <ProfileMetric
                value={roleSpec.trim() ? "Ready" : "Pending"}
                label="Role spec"
              />
            </div>
          </div>

          <GlassCard className="overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80"
              alt="Professional interview preparation"
              className="h-[320px] w-full object-cover"
            />
          </GlassCard>
        </div>
      </section>

      {!isLoaded ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
          <GlassCard className="text-center">
            <p className="text-lg text-gray-300">Loading candidate profile...</p>
          </GlassCard>
        </section>
      ) : !isSignedIn ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
          <GlassCard className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
              Sign in required
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em]">
              Sign in to save your candidate profile.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-300">
              Your candidate profile powers more tailored interview questions
              and better-prioritised feedback across the practice experience.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <SignInButton mode="modal">
                <button className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]">
                  Sign In
                </button>
              </SignInButton>

              <Link
                href="/practice"
                className="rounded-2xl border border-white/10 bg-white/[0.07] px-7 py-4 text-sm font-black text-white transition hover:bg-white/[0.12]"
              >
                Go to practice
              </Link>
            </div>
          </GlassCard>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <GlassCard className="p-6 sm:p-8">
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                  Your information
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em]">
                  Candidate profile details
                </h2>
                <p className="mt-3 text-base leading-8 text-gray-300">
                  Add or upload your profile context below. This will be used to
                  personalise mock interviews and practice feedback.
                </p>
              </div>

              {statusMessage && (
                <div className="mb-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-gray-200">
                  {statusMessage}
                </div>
              )}

              {loading ? (
                <p className="text-gray-300">Loading your profile...</p>
              ) : (
                <div className="space-y-6">
                  <ProfileField
                    label="CV / background"
                    helper="Paste your CV content, career summary or upload a file."
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.12]">
                        {extractingCv ? "Processing CV..." : "Upload CV"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void extractDocumentText(file, "cv");
                            }
                          }}
                        />
                      </label>

                      {cvFileName && (
                        <span className="text-sm text-gray-400">
                          Current file: {cvFileName}
                        </span>
                      )}
                    </div>

                    <textarea
                      value={cvText}
                      onChange={(event) => setCvText(event.target.value)}
                      placeholder="Paste your CV text, work experience, education and key achievements..."
                      className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                    />
                  </ProfileField>

                  <ProfileField
                    label="Target role specification"
                    helper="Add the job description or requirements for the role you are preparing for."
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.12]">
                        {extractingRole
                          ? "Processing role spec..."
                          : "Upload role spec"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void extractDocumentText(file, "roleSpec");
                            }
                          }}
                        />
                      </label>

                      {roleSpecFileName && (
                        <span className="text-sm text-gray-400">
                          Current file: {roleSpecFileName}
                        </span>
                      )}
                    </div>

                    <textarea
                      value={roleSpec}
                      onChange={(event) => setRoleSpec(event.target.value)}
                      placeholder="Paste the job description, responsibilities, requirements or employer expectations..."
                      className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                    />
                  </ProfileField>

                  <ProfileField
                    label="Interview goals"
                    helper="State what you want to improve, such as confidence, STAR structure, concise answers or leadership examples."
                  >
                    <textarea
                      value={interviewGoals}
                      onChange={(event) =>
                        setInterviewGoals(event.target.value)
                      }
                      placeholder="Example: I want stronger behavioural answers, better confidence, and clearer leadership examples."
                      className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                    />
                  </ProfileField>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Candidate Profile"}
                    </button>

                    <Link
                      href="/practice"
                      className="rounded-2xl border border-white/10 bg-white/[0.07] px-7 py-4 text-center text-sm font-black text-white transition hover:bg-white/[0.12]"
                    >
                      Go to practice
                    </Link>
                  </div>
                </div>
              )}
            </GlassCard>

            <div className="space-y-6">
              <GlassCard className="overflow-hidden p-0">
                <img
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80"
                  alt="Professional workspace for candidate preparation"
                  className="h-[250px] w-full object-cover"
                />
                <div className="p-6">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-purple-300">
                    Why this matters
                  </p>
                  <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                    Better context. Better questions. Better feedback.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-gray-300">
                    A strong candidate profile helps the platform generate more
                    relevant questions and more useful coaching feedback.
                  </p>
                </div>
              </GlassCard>

              <GlassCard>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                  Best practice
                </p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-300">
                  <li>• Add a clear CV or career summary</li>
                  <li>• Include the target job description</li>
                  <li>• Note the skills or examples you want to improve</li>
                  <li>• Save the profile before starting practice</li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </section>
      )}
    </MarketingShell>
  );
}

function ProfileMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-xl shadow-black/10">
      <p className="text-2xl font-black tracking-[-0.03em] text-white">
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}

function ProfileField({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-white">
        {label}
      </label>
      <p className="mb-3 text-sm leading-6 text-gray-400">{helper}</p>
      {children}
    </div>
  );
}