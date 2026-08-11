"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

const faqs = [
  {
    q: "What is the STAR method?",
    a: "STAR stands for Situation, Task, Action, Result. It is the most widely used competency interview framework, giving your answer a clear structure that interviewers can follow and evaluate.",
  },
  {
    q: "Is the STAR scorer free?",
    a: "Yes. No account required, no credit card, no usage limits.",
  },
  {
    q: "How does the scoring work?",
    a: "AI evaluates each of the four components (Situation, Task, Action, Result) separately, scoring each out of 10 with specific improvement feedback, plus an overall score and a top improvement suggestion.",
  },
  {
    q: "What types of answers work best?",
    a: "The scorer is designed for competency interview answers, such as 'tell me about a time when...' questions. Write out your full answer as you would speak it, aiming for the equivalent of 2–4 minutes of spoken content.",
  },
  {
    q: "Can I paste any interview answer?",
    a: "Yes. The scorer works with any behavioural or competency answer. Simply paste your answer and the AI will assess how well it fits the STAR structure.",
  },
];

type STARScore = { score: number; feedback: string };
type Result = {
  situation: STARScore;
  task: STARScore;
  action: STARScore;
  result: STARScore;
  overall: number;
  summary: string;
  topImprovement: string;
};

const STAR_LABELS: { key: keyof Omit<Result, "overall" | "summary" | "topImprovement">; label: string; color: string }[] = [
  { key: "situation", label: "Situation", color: "purple" },
  { key: "task", label: "Task", color: "fuchsia" },
  { key: "action", label: "Action", color: "cyan" },
  { key: "result", label: "Result", color: "emerald" },
];

function ScoreBar({ score, color }: { score: number; color: string }) {
  const colorMap: Record<string, string> = {
    purple: "bg-purple-500",
    fuchsia: "bg-fuchsia-500",
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
  };
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorMap[color]}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="w-6 text-right text-sm font-bold">{score}</span>
    </div>
  );
}

export function STARScorerClient() {
  const [role, setRole] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/tools/star-scorer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, question, answer }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }
        setResult(data as Result);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-1 sm:px-6 sm:pt-3">
        {/* Hero */}
        <section className="mb-10 text-center">
          <h1 className="text-[2.2rem] font-bold leading-[1.04] tracking-tight sm:text-4xl">
            Free STAR Answer Scorer
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
            Paste your interview answer. Get an instant score on each STAR
            component (Situation, Task, Action, Result) with specific feedback.
            No account required.
          </p>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-300">
              Your target role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Product Manager at a tech startup"
              required
              maxLength={120}
              className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-purple-400/40 focus:bg-white/[0.07]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-300">
              Interview question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Tell me about a time you led a project under pressure."
              required
              maxLength={300}
              className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-purple-400/40 focus:bg-white/[0.07]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-300">
              Your answer
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type or paste your interview answer here. Aim for 200–500 words for best scoring accuracy."
              required
              maxLength={3000}
              rows={10}
              className="w-full resize-none rounded-2xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-purple-400/40 focus:bg-white/[0.07]"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {answer.length} / 3,000
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-5 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 text-base font-bold text-white shadow-2xl shadow-purple-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Scoring your answer…" : "Score my STAR answer →"}
          </button>

          <p className="text-center text-xs text-gray-400">
            5 free scores per hour · No sign-in required
          </p>
        </form>

        {/* Results */}
        {result && (
          <div className="mt-10 space-y-6">
            {/* Overall */}
            <div className="rounded-[2rem] border border-purple-300/20 bg-purple-300/[0.06] p-7">
              <div className="flex items-center justify-between">
                <p className="font-bold">Overall STAR score</p>
                <span className="text-4xl font-bold tracking-tight">
                  {result.overall}
                  <span className="text-lg text-gray-400">/10</span>
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-400">{result.summary}</p>
            </div>

            {/* Component scores */}
            <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-7">
              <p className="mb-6 font-bold">STAR breakdown</p>
              <div className="space-y-6">
                {STAR_LABELS.map(({ key, label, color }) => (
                  <div key={key}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold">{label}</p>
                    </div>
                    <ScoreBar score={result[key].score} color={color} />
                    <p className="mt-2 text-xs leading-5 text-gray-400">
                      {result[key].feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top improvement */}
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-6">
              <p className="mb-1 text-xs font-bold tracking-wide text-amber-300/80">
                Top improvement
              </p>
              <p className="text-sm leading-6 text-gray-300">
                {result.topImprovement}
              </p>
            </div>

            {/* CTA */}
            <div className="rounded-[2rem] border border-purple-300/20 bg-purple-300/[0.06] p-7 text-center">
              <p className="font-bold">Get full AI coaching on every answer</p>
              <p className="mt-2 text-sm text-gray-400">
                AI Career Mentor generates tailored questions, plays them as audio,
                and scores your voice delivery and camera presence too, not just
                answer content.
              </p>
              <Link
                href="/for-candidates/sign-up"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02]"
              >
                Start free, no credit card →
              </Link>
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-white/[0.07] pt-8">
          <h2 className="mb-6 text-xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mb-8 divide-y divide-white/[0.07]">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-4">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-white">
                  {faq.q}
                  <span className="mt-0.5 shrink-0 text-gray-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-gray-400">{faq.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center text-xs text-gray-400">
            <Link href="/blog" className="hover:text-gray-400">
              Interview guides
            </Link>{" "}
            ·{" "}
            <Link href="/questions" className="hover:text-gray-400">
              Question library
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="hover:text-gray-400">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/contact" className="hover:text-gray-400">
              Contact
            </Link>
          </div>
        </div>
      </div>
  );
}
