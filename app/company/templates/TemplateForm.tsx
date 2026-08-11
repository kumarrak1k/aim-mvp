"use client";

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TemplateType = "interview" | "assessment-centre";
type AcStage = "stage1" | "stage2" | "stage3";
type QuestionMixKey =
  | "opener"
  | "competency"
  | "technical"
  | "leadership"
  | "motivation"
  | "situational"
  | "commercial"
  | "custom";
type QuestionMix = Record<QuestionMixKey, number>;

const QUESTION_MIX_KEYS: QuestionMixKey[] = [
  "opener",
  "competency",
  "technical",
  "leadership",
  "motivation",
  "situational",
  "commercial",
  "custom",
];

const QUESTION_MIX_LABELS: Record<QuestionMixKey, string> = {
  opener: "Tell me about yourself (opener)",
  competency: "Competency / Behavioural",
  technical: "Technical",
  leadership: "Leadership",
  motivation: "Motivation for role",
  situational: "Situational",
  commercial: "Commercial awareness",
  custom: "Your own question (verbatim)",
};

const EMPTY_MIX: QuestionMix = {
  opener: 0,
  competency: 0,
  technical: 0,
  leadership: 0,
  motivation: 0,
  situational: 0,
  commercial: 0,
  custom: 0,
};

function mixTotal(mix: QuestionMix): number {
  return QUESTION_MIX_KEYS.reduce((s, k) => s + mix[k], 0);
}

// ─── Options ──────────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS = [
  "Graduate / entry level",
  "Junior (1-3 years)",
  "Mid-level (3-5 years)",
  "Senior (5-8 years)",
  "Lead / Principal (8+ years)",
];
const INTERVIEW_TYPES = [
  "Competency / behavioural",
  "Technical / skills-based",
  "Situational / case study",
  "Values / culture fit",
  "Mixed / general",
];
const DIFFICULTIES = ["Standard", "Challenging", "Executive"];
const FOCUS_AREAS = [
  "Balanced",
  "Communication",
  "Problem solving",
  "Leadership",
  "Technical depth",
  "Stakeholder management",
];

const AC_STAGE_LABELS: Record<AcStage, { title: string; desc: string; time: string }> = {
  stage1: {
    title: "Case study",
    desc: "Candidate analyses a business scenario and writes a structured recommendation.",
    time: "~30 min",
  },
  stage2: {
    title: "Competency interview",
    desc: "AI conducts a live interview with configurable question types and difficulty.",
    time: "~20–40 min",
  },
  stage3: {
    title: "Presentation",
    desc: "Candidate prepares and submits a written presentation based on the case material.",
    time: "~20 min",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

type TemplateFormProps = {
  initial?: {
    name?: string;
    role?: string;
    description?: string;
    templateType?: TemplateType;
    acStages?: AcStage[];
    questionMix?: Partial<QuestionMix> | null;
    experienceLevel?: string;
    interviewType?: string;
    difficulty?: string;
    focusArea?: string;
    questionCount?: number;
    customInstructions?: string;
    competencyFramework?: string;
    customQuestions?: string[];
  };
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateForm({ initial, onSave, onCancel, saving }: TemplateFormProps) {
  // — common fields —
  const [name, setName] = useState(initial?.name || "");
  const [role, setRole] = useState(initial?.role || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [experienceLevel, setExperienceLevel] = useState(
    initial?.experienceLevel || "Graduate / entry level"
  );
  const [customInstructions, setCustomInstructions] = useState(
    initial?.customInstructions || ""
  );
  const [competencyFramework, setCompetencyFramework] = useState(
    initial?.competencyFramework || ""
  );

  // — template type —
  const [templateType, setTemplateType] = useState<TemplateType>(
    initial?.templateType || "interview"
  );

  // — interview-only fields —
  const [interviewType, setInterviewType] = useState(
    initial?.interviewType || "Competency / behavioural"
  );
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "Standard");
  const [focusArea, setFocusArea] = useState(initial?.focusArea || "Balanced");
  const [questionCount, setQuestionCount] = useState(initial?.questionCount ?? 5);
  const [useQuestionMix, setUseQuestionMix] = useState(
    !!(initial?.questionMix && Object.values(initial.questionMix).some((v) => v > 0))
  );
  const [questionMix, setQuestionMix] = useState<QuestionMix>(() => {
    const init = initial?.questionMix as Partial<QuestionMix> | null | undefined;
    if (!init) return { ...EMPTY_MIX };
    return {
      opener: init.opener ?? 0,
      competency: init.competency ?? 0,
      technical: init.technical ?? 0,
      leadership: init.leadership ?? 0,
      motivation: init.motivation ?? 0,
      situational: init.situational ?? 0,
      commercial: init.commercial ?? 0,
      custom: init.custom ?? 0,
    };
  });

  // Verbatim text for each "custom" question slot — shared between interview
  // and AC-stage2 since a template can only be one type at a time.
  const [customQuestions, setCustomQuestions] = useState<string[]>(
    initial?.customQuestions ?? []
  );

  // — AC fields —
  const [acStages, setAcStages] = useState<AcStage[]>(
    initial?.acStages && initial.acStages.length > 0
      ? initial.acStages
      : ["stage1", "stage2", "stage3"]
  );
  // AC interview sub-config (used for stage2 when selected)
  const [acInterviewType, setAcInterviewType] = useState(
    initial?.interviewType || "Competency / behavioural"
  );
  const [acDifficulty, setAcDifficulty] = useState(initial?.difficulty || "Standard");
  const [acFocusArea, setAcFocusArea] = useState(initial?.focusArea || "Balanced");
  const [acQuestionCount, setAcQuestionCount] = useState(initial?.questionCount ?? 5);
  const [acUseQuestionMix, setAcUseQuestionMix] = useState(
    !!(initial?.questionMix && Object.values(initial.questionMix).some((v) => v > 0))
  );
  const [acQuestionMix, setAcQuestionMix] = useState<QuestionMix>(() => {
    const init = initial?.questionMix as Partial<QuestionMix> | null | undefined;
    if (!init) return { ...EMPTY_MIX };
    return {
      opener: init.opener ?? 0,
      competency: init.competency ?? 0,
      technical: init.technical ?? 0,
      leadership: init.leadership ?? 0,
      motivation: init.motivation ?? 0,
      situational: init.situational ?? 0,
      commercial: init.commercial ?? 0,
      custom: init.custom ?? 0,
    };
  });

  const [formError, setFormError] = useState("");

  // ─── role profile upload ───────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    null
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/extract-document", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Failed to read this file. Try a different format.");
        return;
      }
      setDescription(data.text ?? "");
      setUploadedFileName(file.name);
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearUpload() {
    setDescription("");
    setUploadedFileName(null);
    setUploadError("");
  }

  // ─── helpers ───────────────────────────────────────────────────────────────

  function toggleAcStage(stage: AcStage) {
    setAcStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  }

  function setMixKey(
    mix: QuestionMix,
    setMix: (m: QuestionMix) => void,
    key: QuestionMixKey,
    val: number
  ) {
    setMix({ ...mix, [key]: val });
  }

  // ─── submit ────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("Template name is required."); return; }
    if (!role.trim()) { setFormError("Role is required."); return; }

    // Determine which mix is active so we can validate custom slots
    let activeCustomCount = 0;

    if (templateType === "assessment-centre") {
      if (acStages.length === 0) {
        setFormError("Select at least one assessment centre stage.");
        return;
      }
      const hasInterview = acStages.includes("stage2");
      if (hasInterview && acUseQuestionMix && mixTotal(acQuestionMix) === 0) {
        setFormError("Add at least one question to the question mix.");
        return;
      }
      if (hasInterview && acUseQuestionMix && mixTotal(acQuestionMix) > acQuestionCount) {
        setFormError(
          `Question mix total (${mixTotal(acQuestionMix)}) exceeds the question count (${acQuestionCount}).`
        );
        return;
      }
      if (hasInterview && acUseQuestionMix) {
        activeCustomCount = acQuestionMix.custom;
      }
    } else {
      if (useQuestionMix && mixTotal(questionMix) === 0) {
        setFormError("Add at least one question to the question mix.");
        return;
      }
      if (useQuestionMix && mixTotal(questionMix) > questionCount) {
        setFormError(
          `Question mix total (${mixTotal(questionMix)}) exceeds the question count (${questionCount}).`
        );
        return;
      }
      if (useQuestionMix) {
        activeCustomCount = questionMix.custom;
      }
    }

    // Validate that every custom question slot has text
    for (let i = 0; i < activeCustomCount; i++) {
      if (!customQuestions[i]?.trim()) {
        setFormError(
          activeCustomCount === 1
            ? "Please enter the text for your custom question."
            : `Please enter the text for custom question ${i + 1}.`
        );
        return;
      }
    }

    setFormError("");

    const isAC = templateType === "assessment-centre";
    const hasInterviewStage = isAC && acStages.includes("stage2");

    // Trim and include only the active custom question slots
    const savedCustomQuestions =
      activeCustomCount > 0
        ? customQuestions
            .slice(0, activeCustomCount)
            .map((q) => q.trim())
            .filter(Boolean)
        : undefined;

    onSave({
      name: name.trim(),
      role: role.trim(),
      description: description.trim() || undefined,
      templateType,
      experienceLevel,
      customInstructions: customInstructions.trim() || undefined,
      competencyFramework: competencyFramework.trim() || undefined,
      customQuestions: savedCustomQuestions,
      // AC-specific
      ...(isAC
        ? {
            acStages,
            // Interview-stage config (only meaningful when stage2 selected)
            interviewType: hasInterviewStage ? acInterviewType : "Competency / behavioural",
            difficulty: hasInterviewStage ? acDifficulty : "Standard",
            focusArea: hasInterviewStage ? acFocusArea : "Balanced",
            questionCount: hasInterviewStage ? acQuestionCount : 5,
            questionMix:
              hasInterviewStage && acUseQuestionMix ? acQuestionMix : undefined,
          }
        : {
            // Interview-only
            interviewType,
            difficulty,
            focusArea,
            questionCount,
            questionMix: useQuestionMix ? questionMix : undefined,
          }),
    });
  }

  // ─── styles ────────────────────────────────────────────────────────────────

  const selectClass =
    "w-full rounded-xl border border-white/15 bg-[#1a1328] px-4 py-3 text-white outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20";
  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20";

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">

        {/* ── Template type selector ── */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10">
          <label className="mb-3 block text-sm font-bold text-white">Template type</label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["interview", "assessment-centre"] as TemplateType[]).map((type) => {
              const selected = templateType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTemplateType(type)}
                  className={`rounded-2xl border px-5 py-4 text-left transition ${
                    selected
                      ? "border-fuchsia-400/50 bg-fuchsia-400/10 shadow-lg shadow-fuchsia-950/30"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type === "interview" ? "🎙️" : "🏢"}</span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {type === "interview" ? "Interview only" : "Assessment centre"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {type === "interview"
                          ? "Candidate completes a single AI interview."
                          : "Multi-stage process: case study, interview, presentation."}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Common fields ── */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10">
          <p className="mb-6 text-sm font-bold tracking-wide text-gray-400">
            Template details
          </p>
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  Template name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Software Engineer AC"
                  maxLength={100}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  Role / job title *
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  maxLength={100}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                Description and Role Profile{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>

              {/* Uploaded file chip */}
              {uploadedFileName && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.07] px-3 py-2">
                  <span className="text-sm">📄</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-cyan-200">
                    {uploadedFileName}
                  </span>
                  <button
                    type="button"
                    onClick={clearUpload}
                    className="ml-1 shrink-0 rounded-full p-1 text-cyan-400 transition hover:bg-white/10"
                    title="Remove file and clear text"
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  "Paste your role profile, job description, or a brief overview of what you're looking for in a candidate…"
                }
                rows={6}
                maxLength={5000}
                className={`${inputClass} resize-y`}
              />

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[12px] text-gray-400">
                  {description.length}/5000
                </span>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-gray-300 transition hover:bg-white/[0.10] disabled:opacity-50"
                  >
                    {uploadingFile ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-transparent" />
                        Reading…
                      </>
                    ) : (
                      <>📎 Upload role profile</>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[12px] text-gray-400">
                Accepts PDF, DOCX, TXT, MD. Text is extracted and pasted above.
              </p>

              {uploadError && (
                <p className="mt-2 text-xs text-red-300">{uploadError}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                Experience level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className={selectClass}
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Interview-only config ── */}
        {templateType === "interview" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10">
            <p className="mb-6 text-sm font-bold tracking-wide text-gray-400">
              Interview configuration
            </p>
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-white">
                    Interview type
                  </label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className={selectClass}
                  >
                    {INTERVIEW_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-white">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={selectClass}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-white">
                    Focus area
                  </label>
                  <select
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className={selectClass}
                  >
                    {FOCUS_AREAS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  Number of questions: {questionCount}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-fuchsia-400"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Question mix toggle */}
              <QuestionMixSection
                enabled={useQuestionMix}
                onToggle={() => setUseQuestionMix((v) => !v)}
                mix={questionMix}
                total={questionCount}
                onChange={(key, val) =>
                  setMixKey(questionMix, setQuestionMix, key, val)
                }
              />

              {/* Custom question text inputs */}
              {useQuestionMix && questionMix.custom > 0 && (
                <CustomQuestionsSection
                  count={questionMix.custom}
                  questions={customQuestions}
                  onChange={setCustomQuestions}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Assessment centre config ── */}
        {templateType === "assessment-centre" && (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10">
            <p className="mb-2 text-sm font-bold tracking-wide text-gray-400">
              Assessment centre stages
            </p>
            <p className="mb-6 text-xs text-gray-400">
              Choose which stages to include. Candidates complete them in order.
            </p>
            <div className="space-y-3">
              {(["stage1", "stage2", "stage3"] as AcStage[]).map((stage) => {
                const info = AC_STAGE_LABELS[stage];
                const checked = acStages.includes(stage);
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => toggleAcStage(stage)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                      checked
                        ? "border-fuchsia-400/40 bg-fuchsia-400/[0.08]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-[12px] font-bold ${
                          checked
                            ? "border-fuchsia-400 bg-fuchsia-400 text-white"
                            : "border-white/30 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{info.title}</p>
                          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[12px] font-bold text-gray-400">
                            {info.time}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-gray-400">{info.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stage 2 interview sub-config */}
            {acStages.includes("stage2") && (
              <div className="mt-8 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/[0.04] p-6">
                <p className="mb-4 text-xs font-bold tracking-wide text-fuchsia-300">
                  Competency interview settings
                </p>
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-white">
                        Interview type
                      </label>
                      <select
                        value={acInterviewType}
                        onChange={(e) => setAcInterviewType(e.target.value)}
                        className={selectClass}
                      >
                        {INTERVIEW_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-white">
                        Difficulty
                      </label>
                      <select
                        value={acDifficulty}
                        onChange={(e) => setAcDifficulty(e.target.value)}
                        className={selectClass}
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold text-white">
                        Focus area
                      </label>
                      <select
                        value={acFocusArea}
                        onChange={(e) => setAcFocusArea(e.target.value)}
                        className={selectClass}
                      >
                        {FOCUS_AREAS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-white">
                      Number of questions: {acQuestionCount}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={acQuestionCount}
                      onChange={(e) => setAcQuestionCount(Number(e.target.value))}
                      className="w-full accent-fuchsia-400"
                    />
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>

                  <QuestionMixSection
                    enabled={acUseQuestionMix}
                    onToggle={() => setAcUseQuestionMix((v) => !v)}
                    mix={acQuestionMix}
                    total={acQuestionCount}
                    onChange={(key, val) =>
                      setMixKey(acQuestionMix, setAcQuestionMix, key, val)
                    }
                  />

                  {/* Custom question text inputs for AC stage2 */}
                  {acUseQuestionMix && acQuestionMix.custom > 0 && (
                    <CustomQuestionsSection
                      count={acQuestionMix.custom}
                      questions={customQuestions}
                      onChange={setCustomQuestions}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Shared advanced settings ── */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/10">
          <p className="mb-6 text-sm font-bold tracking-wide text-gray-400">
            Advanced settings{" "}
            <span className="font-normal normal-case text-gray-400">(optional)</span>
          </p>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-white">
                Custom instructions
              </label>
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
              <label className="mb-2 block text-sm font-bold text-white">
                Competency framework
              </label>
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
      </div>

      {formError && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {formError}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-950/35 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save template →"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/15 bg-white/[0.05] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.09]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Custom question text inputs ──────────────────────────────────────────────

function CustomQuestionsSection({
  count,
  questions,
  onChange,
}: {
  count: number;
  questions: string[];
  onChange: (qs: string[]) => void;
}) {
  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20 resize-none";

  return (
    <div className="mt-4 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/[0.04] p-5">
      <p className="mb-1 text-xs font-bold tracking-wide text-fuchsia-300">
        Custom question{count > 1 ? "s" : ""}
      </p>
      <p className="mb-4 text-xs text-gray-400">
        These questions are asked verbatim: the AI skips generation and plays
        your exact text.
      </p>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">
              Question {i + 1}
            </label>
            <textarea
              value={questions[i] ?? ""}
              onChange={(e) => {
                const next = [...questions];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={`e.g. "Tell us about a project where you led cross-functional stakeholders…"`}
              rows={2}
              maxLength={500}
              className={inputClass}
            />
            <p className="mt-1 text-right text-[12px] text-gray-400">
              {(questions[i] ?? "").length}/500
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Question mix sub-component ───────────────────────────────────────────────

function QuestionMixSection({
  enabled,
  onToggle,
  mix,
  total,
  onChange,
}: {
  enabled: boolean;
  onToggle: () => void;
  mix: QuestionMix;
  total: number;
  onChange: (key: QuestionMixKey, val: number) => void;
}) {
  const used = mixTotal(mix);
  const remaining = total - used;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-2xl border px-5 py-3 transition ${
          enabled
            ? "border-cyan-400/30 bg-cyan-400/[0.07]"
            : "border-white/10 bg-white/[0.03] hover:border-white/20"
        }`}
      >
        <div className="text-left">
          <p className="text-sm font-bold text-white">Custom question type mix</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Control exactly how many of each type to include.
          </p>
        </div>
        <span
          className={`ml-4 shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
            enabled
              ? "bg-cyan-400/20 text-cyan-200"
              : "bg-white/[0.06] text-gray-400"
          }`}
        >
          {enabled ? "On" : "Off"}
        </span>
      </button>

      {enabled && (
        <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-5">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-bold tracking-wide text-gray-400">
              Question type distribution
            </span>
            <span
              className={`font-bold ${
                remaining < 0
                  ? "text-red-300"
                  : remaining === 0
                    ? "text-emerald-300"
                    : "text-gray-400"
              }`}
            >
              {used}/{total} allocated
            </span>
          </div>
          <div className="space-y-3">
            {QUESTION_MIX_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-xs font-semibold text-gray-300">
                  {QUESTION_MIX_LABELS[key]}
                  {key === "opener" && (
                    <span className="ml-1.5 rounded-full bg-purple-400/15 px-1.5 py-0.5 text-[12px] font-bold text-purple-300">
                      AI
                    </span>
                  )}
                  {key === "custom" && (
                    <span className="ml-1.5 rounded-full bg-fuchsia-400/15 px-1.5 py-0.5 text-[12px] font-bold text-fuchsia-300">
                      TYPE BELOW
                    </span>
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange(key, Math.max(0, mix[key] - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-sm font-bold text-gray-300 transition hover:bg-white/[0.10]"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-white">
                    {mix[key]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(key, mix[key] + 1)}
                    disabled={remaining <= 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-sm font-bold text-gray-300 transition hover:bg-white/[0.10] disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          {remaining < 0 && (
            <p className="mt-3 text-xs text-red-300">
              Mix total exceeds question count. Reduce some types.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
