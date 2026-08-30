/**
 * Renders a model answer as labelled STAR sections (Situation, Task, Action,
 * Result) when the structured parts are available, so candidates internalise
 * the framework every time they read a model answer. Falls back to the plain
 * flowing answer for older saved sessions or questions where STAR doesn't fit.
 *
 * tone="print" renders the light, print-friendly variant used by the PDF
 * session report.
 */

export type StarParts = {
  situation: string;
  task: string;
  action: string;
  result: string;
};

const SECTIONS: Array<{
  key: keyof StarParts;
  letter: string;
  label: string;
  darkBadge: string;
  darkText: string;
}> = [
  { key: "situation", letter: "S", label: "Situation", darkBadge: "from-purple-400 to-fuchsia-500", darkText: "text-purple-200" },
  { key: "task",      letter: "T", label: "Task",      darkBadge: "from-fuchsia-400 to-pink-500",   darkText: "text-fuchsia-200" },
  { key: "action",    letter: "A", label: "Action",    darkBadge: "from-cyan-400 to-blue-500",      darkText: "text-cyan-200" },
  { key: "result",    letter: "R", label: "Result",    darkBadge: "from-emerald-400 to-teal-500",   darkText: "text-emerald-200" },
];

export function hasStarParts(star: Partial<StarParts> | null | undefined): star is StarParts {
  return Boolean(
    star &&
      typeof star.situation === "string" && star.situation.trim() &&
      typeof star.task === "string" && star.task.trim() &&
      typeof star.action === "string" && star.action.trim() &&
      typeof star.result === "string" && star.result.trim()
  );
}

export function StarAnswer({
  star,
  fallbackText,
  tone = "dark",
}: {
  star?: Partial<StarParts> | null;
  fallbackText?: string;
  tone?: "dark" | "print";
}) {
  if (!hasStarParts(star)) {
    if (!fallbackText) return null;
    return (
      <p
        className={
          tone === "print"
            ? "whitespace-pre-wrap text-[13px] leading-6 text-gray-800"
            : "whitespace-pre-wrap text-sm leading-7 text-gray-100"
        }
      >
        {fallbackText}
      </p>
    );
  }

  if (tone === "print") {
    return (
      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <div key={s.key}>
            <p className="mb-0.5 text-[12px] font-bold tracking-wide text-gray-400">
              {s.label}
            </p>
            <p className="whitespace-pre-wrap text-[13px] leading-6 text-gray-800">
              {star[s.key]}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {SECTIONS.map((s) => (
        <div key={s.key} className="flex items-start gap-3">
          <span
            aria-hidden
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.darkBadge} text-[12px] font-bold text-on-accent`}
          >
            {s.letter}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-[12px] font-bold tracking-wide ${s.darkText}`}>
              {s.label}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-gray-100">
              {star[s.key]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
