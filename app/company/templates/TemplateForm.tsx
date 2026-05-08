"use client";

import { useState } from "react";

type TemplateFormProps = {
  initial?: {
    name?: string;
    role?: string;
    description?: string;
    experienceLevel?: string;
    interviewType?: string;
    difficulty?: string;
    focusArea?: string;
    questionCount?: number;
    customInstructions?: string;
    competencyFramework?: string;
  };
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
};

const EXPERIENCE_LEVELS = [
  "Graduate / entry level", "Junior (1-3 years)", "Mid-level (3-5 years)",
  "Senior (5-8 years)", "Lead / Principal (8+ years)",
];
const INTERVIEW_TYPES = [
  "Competency / behavioural", "Technical / skills-based", "Situational / case study",
  "Values / culture fit", "Mixed / general",
];
const DIFFICULTIES = ["Standard", "Challenging", "Executive"];
const FOCUS_AREAS = ["Balanced", "Communication", "Problem solving", "Leadership", "Technical depth", "Stakeholder management"];

export function TemplateForm({ initial, onSave, onCancel, saving }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [role, setRole] = useState(initial?.role || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [experienceLevel, setExperienceLevel] = useState(initial?.experienceLevel || "Graduate / entry level");
  const [interviewType, setInterviewType] = useState(initial?.interviewType || "Competency / behavioural");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "Standard");
  const [focusArea, setFocusArea] = useState(initial?.focusArea || "Balanced");
  const [questionCount, setQuestionCount] = useState(initial?.questionCount ?? 5);
  const [customInstructions, setCustomInstructions] = useState(initial?.customInstructions || "");
  const [competencyFramework, setCompetencyFramework] = useState(initial?.competencyFramework || "");
  const [formError, setFormError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("Template name is required."); return; }
    if (!role.trim()) { setFormError("Role is required."); return; }
    setFormError("");
    onSave({ name: name.trim(), role: role.trim(), description: description.trim() || undefined, experienceLevel, interviewType, difficulty, focusArea, questionCount, customInstructions: customInstructions.trim() || undefined, competencyFramework: competencyFramework.trim() || undefined });
  }

  const selectClass = "w-full rounded-xl border border-white/15 bg-[#1a1328] px-4 py-3 text-white outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20";
  const inputClass = "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20";

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10">
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-white">Template name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Senior Software Engineer" maxLength={100} className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-white">Role / job title *</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineer" maxLength={100} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-white">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this template (optional)" maxLength={300} className={inputClass} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-white">Experience level</label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={selectClass}>
                {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-white">Interview type</label>
              <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className={selectClass}>
                {INTERVIEW_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-white">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-white">Focus area</label>
              <select value={focusArea} onChange={(e) => setFocusArea(e.target.value)} className={selectClass}>
                {FOCUS_AREAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-white">Number of questions: {questionCount}</label>
            <input type="range" min={3} max={10} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full accent-fuchsia-400" />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>3</span><span>10</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-white">Custom instructions <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Any specific focus areas, scenarios, or instructions for the AI interviewer…"
              rows={3}
              maxLength={2000}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-white">Competency framework <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={competencyFramework}
              onChange={(e) => setCompetencyFramework(e.target.value)}
              placeholder="Paste your competency framework, grading rubric, or evaluation criteria here…"
              rows={4}
              maxLength={2000}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {formError && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{formError}</p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-3.5 text-sm font-black text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save template →"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/15 bg-white/[0.05] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.09]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
