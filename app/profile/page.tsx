"use client";

import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";

type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  updatedAt: string;
};

type ProfileLimits = {
  cvText: number;
  roleSpec: number;
  interviewGoals: number;
  total: number;
};

const EMPTY_PROFILE: CandidateProfile = {
  cvText: "",
  roleSpec: "",
  interviewGoals: "",
  cvFileName: "",
  roleSpecFileName: "",
  updatedAt: "",
};

const DEFAULT_LIMITS: ProfileLimits = {
  cvText: 3500,
  roleSpec: 2500,
  interviewGoals: 900,
  total: 7000,
};

function formatDateTime(value: string) {
  if (!value) return "Not saved yet";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function CandidateProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();

  const cvFileInputRef = useRef<HTMLInputElement | null>(null);
  const roleFileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<CandidateProfile>(EMPTY_PROFILE);
  const [limits, setLimits] = useState<ProfileLimits>(DEFAULT_LIMITS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingRoleSpec, setUploadingRoleSpec] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const totalChars = useMemo(() => {
    return (
      profile.cvText.length +
      profile.roleSpec.length +
      profile.interviewGoals.length
    );
  }, [profile]);

  const isOverLimit =
    profile.cvText.length > limits.cvText ||
    profile.roleSpec.length > limits.roleSpec ||
    profile.interviewGoals.length > limits.interviewGoals ||
    totalChars > limits.total;

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setStatusMessage("");

        const res = await fetch("/api/candidate-profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setErrorMessage(data.error || "Failed to load profile.");
          return;
        }

        setProfile({
          ...EMPTY_PROFILE,
          ...(data.profile || {}),
        });
        setLimits(data.limits || DEFAULT_LIMITS);
      } catch {
        setErrorMessage("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [isLoaded, isSignedIn]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      setErrorMessage("");
      setStatusMessage("");

      const res = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to save profile.");
        return;
      }

      setProfile({
        ...EMPTY_PROFILE,
        ...(data.profile || profile),
      });
      setLimits(data.limits || limits);
      setStatusMessage(
        "Profile saved. Future interview questions can use this context once Step 2 is added."
      );
    } catch {
      setErrorMessage("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof CandidateProfile, value: string) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const uploadDocument = async (
    file: File | undefined,
    target: "cv" | "roleSpec"
  ) => {
    if (!file) return;

    try {
      setErrorMessage("");
      setStatusMessage("");

      if (target === "cv") {
        setUploadingCv(true);
      } else {
        setUploadingRoleSpec(true);
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Failed to extract document text.");
        return;
      }

      if (target === "cv") {
        setProfile((previous) => ({
          ...previous,
          cvText: data.text || "",
          cvFileName: data.fileName || file.name,
        }));
      } else {
        setProfile((previous) => ({
          ...previous,
          roleSpec: data.text || "",
          roleSpecFileName: data.fileName || file.name,
        }));
      }

      setStatusMessage(
        data.message ||
          "Document text extracted. Review it, then click Save Profile."
      );
    } catch {
      setErrorMessage("Something went wrong while uploading this document.");
    } finally {
      if (target === "cv") {
        setUploadingCv(false);
        if (cvFileInputRef.current) cvFileInputRef.current.value = "";
      } else {
        setUploadingRoleSpec(false);
        if (roleFileInputRef.current) roleFileInputRef.current.value = "";
      }
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07030d] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07030d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-purple-500/25 blur-xl" />
              <div className="relative rounded-2xl border border-white/15 bg-white/95 p-1 shadow-lg shadow-purple-950/40">
                <img
                  src="/brand/logo.jpg"
                  alt="AI Career Mentor"
                  className="h-11 w-11 rounded-xl object-contain"
                />
              </div>
            </div>

            <div>
              <p className="text-lg font-black tracking-[-0.03em]">
                AI Career Mentor
              </p>
              <p className="text-xs font-medium text-purple-100/55">
                Candidate profile
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/practice">
              <button className="hidden rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-black text-white transition hover:bg-white/[0.1] sm:block">
                Practice
              </button>
            </Link>

            {!isSignedIn && (
              <SignInButton mode="modal">
                <button className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100">
                  Sign In
                </button>
              </SignInButton>
            )}

            {isLoaded && isSignedIn && <UserButton />}
          </div>
        </div>
      </header>

      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-purple-700/30 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-220px] top-24 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute left-[-220px] top-80 h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-10 lg:py-12">
          <section className="mb-8 overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl md:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-purple-50 shadow-xl shadow-purple-950/20">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </span>
                  Personalised interview context
                </div>

                <h1 className="max-w-4xl text-3xl font-black leading-[1.02] tracking-[-0.045em] md:text-5xl">
                  Upload your CV and target role so AIM can give{" "}
                  <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                    more tailored coaching.
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl leading-7 text-gray-300">
                  Upload a document or paste text manually. AIM extracts the
                  useful text into your secure profile, then you can review and
                  save it.
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-white/10 bg-black/30 p-5 shadow-xl shadow-black/10 lg:min-w-[300px]">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-purple-300">
                  Profile status
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  Signed in as
                </p>
                <p className="mt-1 break-all font-black text-white">
                  {isLoaded && isSignedIn
                    ? user?.primaryEmailAddress?.emailAddress || "Signed in"
                    : "Not signed in"}
                </p>
                <p className="mt-4 text-sm leading-6 text-gray-400">
                  Last saved
                </p>
                <p className="mt-1 font-bold text-cyan-200">
                  {formatDateTime(profile.updatedAt)}
                </p>
              </div>
            </div>
          </section>

          {!isLoaded && (
            <GlassCard>
              <p className="text-gray-300">Loading account...</p>
            </GlassCard>
          )}

          {isLoaded && !isSignedIn && (
            <GlassCard>
              <div className="max-w-2xl">
                <p className="mb-2 text-sm font-black uppercase tracking-[0.22em] text-purple-300">
                  Sign in required
                </p>
                <h2 className="text-2xl font-black tracking-[-0.03em]">
                  Create an account or sign in to save your candidate profile.
                </h2>
                <p className="mt-3 leading-7 text-gray-400">
                  Your profile is only available to your signed-in account and is
                  saved through a protected server route.
                </p>

                <SignInButton mode="modal">
                  <button className="mt-6 rounded-2xl bg-white px-6 py-3 font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </GlassCard>
          )}

          {isLoaded && isSignedIn && (
            <div className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
              <GlassCard>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-2 text-sm font-black uppercase tracking-[0.22em] text-purple-300">
                      Candidate profile
                    </p>
                    <h2 className="text-2xl font-black tracking-[-0.03em] md:text-3xl">
                      Upload or paste your interview context.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                      Upload a CV or role spec file, review the extracted text,
                      then save your profile. Supported files: .txt, .md, .docx
                      and .pdf.
                    </p>
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={saving || loading || isOverLimit}
                    className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-3 text-sm font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <UploadCard
                    title="Upload CV"
                    description="Upload your CV or a career summary. The extracted text will replace the CV field below."
                    fileName={profile.cvFileName}
                    uploading={uploadingCv}
                    inputRef={cvFileInputRef}
                    onFileSelected={(file) => uploadDocument(file, "cv")}
                  />

                  <UploadCard
                    title="Upload role spec"
                    description="Upload a job advert or role description. The extracted text will replace the role spec field below."
                    fileName={profile.roleSpecFileName}
                    uploading={uploadingRoleSpec}
                    inputRef={roleFileInputRef}
                    onFileSelected={(file) => uploadDocument(file, "roleSpec")}
                  />
                </div>

                {loading && (
                  <div className="mb-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-gray-300">
                    Loading saved profile...
                  </div>
                )}

                {statusMessage && (
                  <div className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-semibold leading-6 text-emerald-200">
                    {statusMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-5 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm font-semibold leading-6 text-red-200">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-5">
                  <TextAreaField
                    label="CV / career background"
                    helper="Paste or upload a concise CV summary: roles, achievements, skills, qualifications and measurable impact."
                    value={profile.cvText}
                    max={limits.cvText}
                    rows={10}
                    placeholder="Example: I am a graduate software engineer with experience in React, Next.js and customer-facing support. I built..."
                    onChange={(value) => updateField("cvText", value)}
                  />

                  <TextAreaField
                    label="Target role specification"
                    helper="Paste or upload the role spec or job advert. Include responsibilities, required skills and company context."
                    value={profile.roleSpec}
                    max={limits.roleSpec}
                    rows={8}
                    placeholder="Example: The role requires strong communication, stakeholder management, data analysis and experience delivering..."
                    onChange={(value) => updateField("roleSpec", value)}
                  />

                  <TextAreaField
                    label="Interview goals"
                    helper="Tell AIM what you want to improve or what you are worried about."
                    value={profile.interviewGoals}
                    max={limits.interviewGoals}
                    rows={5}
                    placeholder="Example: I want to improve confidence, reduce filler words, and practise STAR answers with stronger measurable outcomes."
                    onChange={(value) => updateField("interviewGoals", value)}
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">
                      Total profile size
                    </p>
                    <p
                      className={`mt-1 text-sm ${
                        totalChars > limits.total
                          ? "text-red-300"
                          : "text-gray-400"
                      }`}
                    >
                      {totalChars.toLocaleString()} /{" "}
                      {limits.total.toLocaleString()} characters
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href="/practice">
                      <button className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                        Go to Practice
                      </button>
                    </Link>

                    <button
                      onClick={saveProfile}
                      disabled={saving || loading || isOverLimit}
                      className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3 text-sm font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              </GlassCard>

              <aside className="space-y-6">
                <GlassCard>
                  <h2 className="mb-4 text-xl font-black text-white">
                    Upload behaviour
                  </h2>
                  <div className="space-y-3 text-sm leading-6 text-gray-400">
                    <CheckItem>Files are processed server-side</CheckItem>
                    <CheckItem>Raw file is not permanently stored yet</CheckItem>
                    <CheckItem>Extracted text appears for review</CheckItem>
                    <CheckItem>You choose when to save profile</CheckItem>
                    <CheckItem>Large text is trimmed to fit limits</CheckItem>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h2 className="mb-4 text-xl font-black text-white">
                    What gets used later
                  </h2>
                  <div className="space-y-3 text-sm leading-6 text-gray-400">
                    <CheckItem>CV achievements and experience</CheckItem>
                    <CheckItem>Target role responsibilities</CheckItem>
                    <CheckItem>Required skills and keywords</CheckItem>
                    <CheckItem>Interview confidence goals</CheckItem>
                    <CheckItem>Preferred development focus</CheckItem>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h2 className="mb-4 text-xl font-black text-white">
                    Recommended files
                  </h2>
                  <div className="space-y-3 text-sm leading-6 text-gray-400">
                    <CheckItem>DOCX works best for CV extraction</CheckItem>
                    <CheckItem>Text-based PDF usually works</CheckItem>
                    <CheckItem>Scanned image PDFs may fail</CheckItem>
                    <CheckItem>Keep files under 5MB</CheckItem>
                  </div>
                </GlassCard>
              </aside>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl md:p-7 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

function UploadCard({
  title,
  description,
  fileName,
  uploading,
  inputRef,
  onFileSelected,
}: {
  title: string;
  description: string;
  fileName: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
      <div className="mb-4">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          {title}
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.docx,.pdf"
        className="hidden"
        onChange={(event) => onFileSelected(event.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Extracting text..." : "Choose File"}
      </button>

      <p className="mt-3 min-h-5 truncate text-xs text-gray-500">
        {fileName ? `Last file: ${fileName}` : "No file uploaded yet"}
      </p>
    </div>
  );
}

function TextAreaField({
  label,
  helper,
  value,
  max,
  rows,
  placeholder,
  onChange,
}: {
  label: string;
  helper: string;
  value: string;
  max: number;
  rows: number;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const isOver = value.length > max;

  return (
    <div>
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label className="block text-sm font-black uppercase tracking-[0.18em] text-purple-300">
            {label}
          </label>
          <p className="mt-1 text-sm leading-6 text-gray-500">{helper}</p>
        </div>

        <p
          className={`text-xs font-black ${
            isOver ? "text-red-300" : "text-gray-500"
          }`}
        >
          {value.length.toLocaleString()} / {max.toLocaleString()}
        </p>
      </div>

      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border bg-black/35 p-4 leading-7 text-white placeholder-gray-600 outline-none transition focus:ring-4 ${
          isOver
            ? "border-red-300/50 focus:border-red-300/70 focus:ring-red-500/10"
            : "border-white/10 focus:border-purple-300/50 focus:ring-purple-500/10"
        }`}
      />
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="text-purple-300">✓</span>
      <span>{children}</span>
    </p>
  );
}