"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { TemplateForm } from "../TemplateForm";

type Template = {
  id: string;
  name: string;
  role: string;
  description: string | null;
  templateType: string;
  acStages: string[];
  questionMix: Record<string, number> | null;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  questionCount: number;
  customInstructions: string | null;
  competencyFramework: string | null;
  customQuestions: string[];
  isActive: boolean;
};

export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/company/templates/${id}`);
        const data = await res.json();
        if (!res.ok || !data.template) { router.push("/company/templates"); return; }
        setTemplate(data.template);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, router]);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/company/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to update template."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/company/templates"), 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <CorporateAppShell currentPath="/company/templates">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
        </div>
      </CorporateAppShell>
    );
  }

  if (!template) return null;

  return (
    <CorporateAppShell currentPath="/company/templates">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-bold tracking-wide text-fuchsia-300">Edit Template</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{template.name}</h1>
        </div>
        {success && (
          <p className="mb-6 rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-300">
            Template saved. Redirecting…
          </p>
        )}
        {error && (
          <p className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}
        <TemplateForm
          initial={{
            name: template.name,
            role: template.role,
            description: template.description || "",
            templateType: (template.templateType as "interview" | "assessment-centre") || "interview",
            acStages: (template.acStages as Array<"stage1" | "stage2" | "stage3">) || [],
            questionMix: template.questionMix as Record<string, number> | null,
            experienceLevel: template.experienceLevel,
            interviewType: template.interviewType,
            difficulty: template.difficulty,
            focusArea: template.focusArea,
            questionCount: template.questionCount,
            customInstructions: template.customInstructions || "",
            competencyFramework: template.competencyFramework || "",
            customQuestions: template.customQuestions ?? [],
          }}
          onSave={handleSave}
          saving={saving}
          onCancel={() => router.push("/company/templates")}
        />
      </div>
    </CorporateAppShell>
  );
}
