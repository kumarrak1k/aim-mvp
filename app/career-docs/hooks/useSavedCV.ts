"use client";

import { useState, useEffect, useCallback } from "react";

export type SavedCVState = {
  cvText: string;
  cvFileName: string;
  hasSavedCV: boolean;
  loading: boolean;
  uploading: boolean;
  removing: boolean;
  saving: boolean;
  error: string;
  uploadCV: (file: File) => Promise<void>;
  removeCV: () => Promise<void>;
  saveText: (text: string) => Promise<void>;
};

/**
 * Shared hook for Career Docs pages.
 *
 * - On mount: loads saved CV from the candidate profile via GET /api/candidate-profile
 * - uploadCV(file): extracts text from a PDF/DOCX via /api/extract-document,
 *   then saves cvText + cvFileName back to the profile via POST /api/candidate-profile
 * - saveText(text): persists manually edited CV text to the profile (keeps the
 *   file name if the text still derives from an uploaded file)
 * - removeCV(): clears cvText and cvFileName in the profile, resets local state
 */
export function useSavedCV(): SavedCVState {
  const [cvText, setCvText] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load saved CV on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/candidate-profile", { method: "GET" });
        if (!res.ok) return;
        const data = await res.json() as { profile?: { cvText?: string; cvFileName?: string } };
        if (cancelled) return;
        setCvText(data.profile?.cvText?.trim() ?? "");
        setCvFileName(data.profile?.cvFileName?.trim() ?? "");
      } catch {
        // Silently ignore — CV just won't be pre-filled
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const saveToProfile = useCallback(async (nextCvText: string, nextCvFileName: string) => {
    const res = await fetch("/api/candidate-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText: nextCvText, cvFileName: nextCvFileName }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(data?.error ?? "Could not save CV to profile.");
    }
  }, []);

  const uploadCV = useCallback(async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const extractRes = await fetch("/api/extract-document", {
        method: "POST",
        body: formData,
      });
      const extractData = await extractRes.json() as { text?: string; extractedText?: string; content?: string; error?: string };
      if (!extractRes.ok || extractData.error) {
        setError(extractData.error ?? "Could not extract text from file.");
        return;
      }
      const extracted = (extractData.text || extractData.extractedText || extractData.content || "").trim();
      if (!extracted) {
        setError("No text could be extracted from that file.");
        return;
      }
      await saveToProfile(extracted, file.name);
      setCvText(extracted);
      setCvFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [saveToProfile]);

  const saveText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    setSaving(true);
    setError("");
    try {
      await saveToProfile(trimmed, trimmed ? cvFileName : "");
      setCvText(trimmed);
      if (!trimmed) setCvFileName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save CV.");
    } finally {
      setSaving(false);
    }
  }, [saveToProfile, cvFileName]);

  const removeCV = useCallback(async () => {
    setRemoving(true);
    setError("");
    try {
      await saveToProfile("", "");
      setCvText("");
      setCvFileName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove CV.");
    } finally {
      setRemoving(false);
    }
  }, [saveToProfile]);

  return {
    cvText,
    cvFileName,
    hasSavedCV: Boolean(cvText),
    loading,
    uploading,
    removing,
    saving,
    error,
    uploadCV,
    removeCV,
    saveText,
  };
}
