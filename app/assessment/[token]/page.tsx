"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

type AssessmentData = {
  assignment: {
    id: string;
    status: string;
    expiresAt: string;
    candidateEmailMasked: string;
  };
  company: {
    name: string;
    slug: string;
    brandColor: string;
    logoUrl: string | null;
  };
  template: {
    name: string;
    role: string;
    description: string | null;
    experienceLevel: string;
    interviewType: string;
    difficulty: string;
    focusArea: string;
    questionCount: number;
  };
};

export default function AssessmentLandingPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [error, setError] = useState<{ message: string; code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assessment/${token}`);
        const json = await res.json();
        if (!res.ok) { setError({ message: json.error, code: res.status }); return; }
        setData(json);
      } catch {
        setError({ message: "Failed to load assessment.", code: 500 });
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  function handleStart() {
    if (!data) return;
    const t = data.template;
    const params = new URLSearchParams({
      role: t.role,
      experienceLevel: t.experienceLevel,
      interviewType: t.interviewType,
      difficulty: t.difficulty,
      focusArea: t.focusArea,
      totalQuestions: String(t.questionCount),
      assignmentToken: token,
    });
    router.push(`/practice/session?${params}`);
  }

  if (loading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#120d1e]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#120d1e] px-4 text-center text-white">
        <div className="mb-6 text-6xl">{error.code === 409 ? "✅" : error.code === 410 ? "⏰" : "🔗"}</div>
        <h1 className="mb-3 text-2xl font-black">
          {error.code === 409 ? "Assessment already completed" : error.code === 410 ? "This invite has expired" : "Invalid invite link"}
        </h1>
        <p className="mb-8 text-gray-400">{error.message}</p>
        <Link href="/">
          <button className="rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-black text-white transition hover:bg-white/[0.10]">
            Go to AI Career Mentor →
          </button>
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { assignment, company, template } = data;
  const daysLeft = Math.max(0, Math.ceil((new Date(assignment.expiresAt).getTime() - Date.now()) / 86400000));

  const infoItems = [
    { label: "Role", value: template.role },
    { label: "Level", value: template.experienceLevel },
    { label: "Type", value: template.interviewType },
    { label: "Questions", value: `${template.questionCount} questions` },
    { label: "Difficulty", value: template.difficulty },
    { label: "Focus", value: template.focusArea },
  ];

  return (
    <div className="min-h-screen bg-[#120d1e] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(140,92,255,0.15),transparent_35%),linear-gradient(180deg,#120d1e_0%,#171224_100%)]" />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Company branding */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-xl"
            style={{ background: company.brandColor || "#8c5cff" }}
          >
            {company.name.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-gray-400">{company.name} invites you to</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">{template.name}</h1>
          {template.description && (
            <p className="mt-3 text-base leading-7 text-gray-300">{template.description}</p>
          )}
        </div>

        {/* Info card */}
        <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-black/10 backdrop-blur-2xl">
          <h2 className="mb-5 text-base font-black text-gray-200">Assessment details</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {infoItems.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-black uppercase tracking-wider text-gray-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="mb-3 text-sm font-black text-gray-300">What to expect</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2"><span className="text-purple-400">→</span> AI-powered interview powered by AI Career Mentor</li>
              <li className="flex gap-2"><span className="text-purple-400">→</span> Personalised questions tailored to {template.role}</li>
              <li className="flex gap-2"><span className="text-purple-400">→</span> Detailed feedback on your answers</li>
              <li className="flex gap-2"><span className="text-purple-400">→</span> Results sent automatically to {company.name}</li>
            </ul>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3">
            <span className="text-yellow-300">⏰</span>
            <p className="text-sm text-yellow-200">
              {daysLeft === 0 ? "Expires today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining to complete`}
            </p>
          </div>
        </div>

        {/* CTA */}
        {isSignedIn ? (
          <div className="text-center">
            <button
              onClick={handleStart}
              className="w-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 py-4 text-base font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] sm:w-auto sm:px-12"
            >
              Start assessment →
            </button>
            <p className="mt-3 text-xs text-gray-500">
              Invite was sent to {assignment.candidateEmailMasked}. Make sure you are signed in to the correct account.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <SignInButton mode="modal">
              <button className="w-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 py-4 text-base font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] sm:w-auto sm:px-12">
                Sign in to begin →
              </button>
            </SignInButton>
            <p className="mt-3 text-xs text-gray-500">
              Create a free account or sign in to start. Your results are saved securely.
            </p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-gray-600">
          Powered by <Link href="/" className="text-gray-500 hover:text-gray-400">AI Career Mentor</Link>
        </p>
      </div>
    </div>
  );
}
