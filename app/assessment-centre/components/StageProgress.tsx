"use client";

type Props = {
  currentStage: 1 | 2 | 3;
  selectedStages?: string[];
};

const ALL_STAGES = [
  { num: 1 as const, id: "stage1", label: "Case Study", icon: "📋" },
  { num: 2 as const, id: "stage2", label: "Interview", icon: "🎤" },
  { num: 3 as const, id: "stage3", label: "Presentation", icon: "📊" },
];

export function StageProgress({ currentStage, selectedStages }: Props) {
  const stages = selectedStages
    ? ALL_STAGES.filter((s) => selectedStages.includes(s.id))
    : ALL_STAGES;

  // Re-number stages sequentially for display
  const displayStages = stages.map((s, i) => ({ ...s, displayNum: i + 1 }));

  // Find the display position of the current stage
  const currentDisplayNum =
    displayStages.find((s) => s.num === currentStage)?.displayNum ?? currentStage;

  return (
    <div className="flex items-center gap-0 mb-8">
      {displayStages.map((stage, idx) => {
        const isPast = stage.displayNum < currentDisplayNum;
        const isActive = stage.displayNum === currentDisplayNum;

        return (
          <div key={stage.id} className="flex items-center">
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
                  <span>{stage.displayNum}</span>
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
