"use client";

export function CopyBoilerplate({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(text)}
      className="mt-5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-gray-400 transition hover:bg-white/[0.09] hover:text-white"
    >
      Copy boilerplate
    </button>
  );
}
