"use client";

import { useEffect, useMemo, useState } from "react";
import { MarketingShell } from "@/app/components/marketing/MarketingShell";
import { ProfileDetailsForm } from "./ProfileDetailsForm";
import { ProfileHero } from "./ProfileHero";
import { ProfileLoadingState, ProfileSignedOutState } from "./ProfileStates";
import type { CandidateProfile, ProfileUploadTarget } from "../types";

export function CandidateProfileClient() {
  const { useUser } = require("@clerk/nextjs") as typeof import("@clerk/nextjs");
  const { isLoaded, isSignedIn } = useUser();

  const [cvText, setCvText] = useState("");
  const [roleSpec, setRoleSpec] = useState("");
  const [interviewGoals, setInterviewGoals] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [roleSpecFileName, setRoleSpecFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extractingCv, setExtractingCv] = useState(false);
  const [extractingRole, setExtractingRole] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/candidate-profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!cancelled && res.ok && data.profile) {
          const profile = data.profile as CandidateProfile;
          setCvText(profile.cvText || "");
          setRoleSpec(profile.roleSpec || "");
          setInterviewGoals(profile.interviewGoals || "");
          setCvFileName(profile.cvFileName || "");
          setRoleSpecFileName(profile.roleSpecFileName || "");
        }
      } catch {
        if (!cancelled) {
          setStatusMessage("Unable to load your saved candidate profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const completionScore = useMemo(() => {
    let score = 0;
    if (cvText.trim()) score += 34;
    if (roleSpec.trim()) score += 33;
    if (interviewGoals.trim()) score += 33;
    return Math.min(100, score);
  }, [cvText, roleSpec, interviewGoals]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMessage("");

      const res = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText,
          roleSpec,
          interviewGoals,
          cvFileName,
          roleSpecFileName,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatusMessage(data.error || "Could not save candidate profile.");
        return;
      }

      setStatusMessage("Candidate profile saved successfully.");
    } catch {
      setStatusMessage("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  };

  const extractDocumentText = async (
    file: File,
    target: ProfileUploadTarget
  ) => {
    try {
      if (target === "cv") setExtractingCv(true);
      if (target === "roleSpec") setExtractingRole(true);
      setStatusMessage("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatusMessage(data.error || "Could not extract text from file.");
        return;
      }

      const extractedText =
        data.text || data.extractedText || data.content || "";

      if (target === "cv") {
        setCvText(extractedText || cvText);
        setCvFileName(file.name);
      } else {
        setRoleSpec(extractedText || roleSpec);
        setRoleSpecFileName(file.name);
      }

      setStatusMessage(`${file.name} processed successfully.`);
    } catch {
      setStatusMessage("File upload failed.");
    } finally {
      if (target === "cv") setExtractingCv(false);
      if (target === "roleSpec") setExtractingRole(false);
    }
  };

  return (
    <MarketingShell currentPath="/profile">
      <ProfileHero
        completionScore={completionScore}
        hasCvContext={Boolean(cvText.trim())}
        hasRoleSpec={Boolean(roleSpec.trim())}
      />

      {!isLoaded ? (
        <ProfileLoadingState />
      ) : !isSignedIn ? (
        <ProfileSignedOutState />
      ) : (
        <ProfileDetailsForm
          cvText={cvText}
          setCvText={setCvText}
          roleSpec={roleSpec}
          setRoleSpec={setRoleSpec}
          interviewGoals={interviewGoals}
          setInterviewGoals={setInterviewGoals}
          cvFileName={cvFileName}
          roleSpecFileName={roleSpecFileName}
          loading={loading}
          saving={saving}
          extractingCv={extractingCv}
          extractingRole={extractingRole}
          statusMessage={statusMessage}
          handleSave={handleSave}
          extractDocumentText={extractDocumentText}
        />
      )}
    </MarketingShell>
  );
}