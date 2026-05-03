"use client";

import { MiniStat } from "./PracticeUi";

export function PracticeHero({ totalQuestions }: { totalQuestions: number }) {
  return (
    <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:mb-8 sm:rounded-[2.25rem] sm:p-6 md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-purple-50 shadow-xl shadow-purple-950/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </span>
            Voice + video + AI interview feedback
          </div>

          <h1 className="max-w-4xl text-3xl font-black leading-[1.02] tracking-[-0.045em] md:text-5xl">
            Practise your next interview with{" "}
            <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              precision coaching.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-gray-300">
            Complete a focused 5-question mock interview and receive strict
            hiring-bar feedback across your answers, voice delivery, camera
            presence, confidence, pace and structure.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-3 sm:min-w-[260px]">
          <MiniStat value={String(totalQuestions)} label="Questions" />
          <MiniStat value="360°" label="Feedback" />
          <MiniStat value="8+" label="Target" />
        </div>
      </div>
    </div>
  );
}
