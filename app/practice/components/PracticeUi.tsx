"use client";

import type { ReactNode } from "react";
import type { SectionFeedbackItem } from "../types";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6 md:p-7 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  defaultOption,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  /** Option whose display label gets a "(default)" suffix. Value is unchanged. */
  defaultOption?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-200">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-recess-35 p-4 text-white outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-background">
            {option === defaultOption ? `${option} (default)` : option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-gradient-to-r from-violet-600 to-purple-600 text-on-accent shadow-lg shadow-purple-950/30"
          : "border border-white/10 bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]"
      }`}
    >
      {children}
    </button>
  );
}

export function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-recess-30 p-4 text-center shadow-xl shadow-black/10">
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-400">{label}</p>
    </div>
  );
}

export function AnalysisPanel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: "cyan" | "purple";
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.6rem] border p-5 ${
        accent === "cyan"
          ? "border-cyan-300/20 bg-cyan-300/10"
          : "border-purple-300/20 bg-purple-300/10"
      }`}
    >
      <h3
        className={`mb-4 text-lg font-bold ${
          accent === "cyan" ? "text-cyan-300" : "text-purple-300"
        }`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function FeedbackList({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div>
      <h3 className={`mb-2 text-lg font-bold ${color}`}>{title}</h3>
      <ul className="list-disc space-y-1 pl-5 leading-7 text-gray-200">
        {items?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function CheckItem({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="text-purple-300">✓</span>
      <span>{children}</span>
    </p>
  );
}

export function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-recess-35 p-4 text-center shadow-xl shadow-black/10">
      <p className="text-xs font-bold tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">
        {value}
        <span className="text-sm text-gray-400">/10</span>
      </p>
    </div>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-recess-35 p-4 text-center shadow-xl shadow-black/10">
      <p className="text-xs font-bold tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export function SectionFeedbackCard({
  title,
  item,
}: {
  title: string;
  item: SectionFeedbackItem;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-recess-35 p-5 shadow-xl shadow-black/10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-bold text-white">{title}</h4>
        <span className="rounded-full bg-purple-300/15 px-3 py-1 text-sm font-bold text-purple-200">
          {item.score}/10
        </span>
      </div>
      <p className="mb-3 text-sm leading-6 text-gray-300">{item.feedback}</p>
      <p className="text-sm leading-6 text-orange-200">
        <span className="font-bold">Improve: </span>
        {item.improvement}
      </p>
    </div>
  );
}
