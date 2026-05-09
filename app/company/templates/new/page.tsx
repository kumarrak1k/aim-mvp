"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CorporateAppShell } from "@/app/components/marketing/CorporateAppShell";
import { TemplateForm } from "../TemplateForm";

export default function NewTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/company/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to create template."); return; }
      router.push("/company/templates");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CorporateAppShell currentPath="/company/templates">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-fuchsia-300">New Template</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Create assessment template</h1>
          <p className="mt-2 text-gray-400">Configure the interview parameters for this role.</p>
        </div>
        {error && (
          <p className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}
        <TemplateForm onSave={handleSave} saving={saving} onCancel={() => router.back()} />
      </div>
    </CorporateAppShell>
  );
}
