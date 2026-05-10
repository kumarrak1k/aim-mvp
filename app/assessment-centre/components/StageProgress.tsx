"use client";

type Props = {
  currentStage: 1 | 2 | 3;
};

const stages = [
  { num: 1, label: "Case Study", icon: "📋" },
  { num: 2, label: "Interview", icon: "🎤" },
  { num: 3, label: "Presentation", icon: "📊" },
] as const;

export function StageProgress({ currentStage }: Props) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {stages.map((stage, idx) => {
        const isPast = stage.num < currentStage;
        const isActive = stage.num === currentStage;
        const isFuture = stage.num > currentStage;

        return (
          <div key={stage.num} className="flex items-center">
            {/* Connector line before stage (except first) */}
            {idx > 0 && (
              <div
                className={`h-px w-8 sm:w-12 transition-colors ${
                  isPast ? "bg-gradient-to-r from-purple-500 to-cyan-400" : "bg-white/10"
                }`}
              />
            )}

            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black transition-all ${
                  isActive
                    ? "border-cyan-400/60 bg-gradient-to-br from-purple-500/30 to-cyan-400/20 text-cyan-300 shadow-lg shadow-cyan-900/30 ring-2 ring-cyan-400/30"
                    : isPast
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/[0.03] text-gray-600"
                }`}
              >
                {isPast ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{stage.num}</span>
                )}
                {isActive && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap ${
                  isActive ? "text-cyan-300" : isPast ? "text-emerald-400/80" : "text-gray-600"
                }`}
              >
                {stage.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
