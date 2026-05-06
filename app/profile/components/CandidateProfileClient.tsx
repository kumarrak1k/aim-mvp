"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MarketingShell } from "@/app/components/marketing/MarketingShell";
import { ProfileDetailsForm } from "./ProfileDetailsForm";
import { ProfileHero } from "./ProfileHero";
import { ProfileLoadingState, ProfileSignedOutState } from "./ProfileStates";
import type { CandidateProfile, ProfileUploadTarget } from "../types";

export function CandidateProfileClient() {
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
  const [removingCv, setRemovingCv] = useState(false);
  const [removingRoleSpec, setRemovingRoleSpec] = useState(false);
  const [clearingProfileContext, setClearingProfileContext] = useState(false);
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

        if (!cancelled && (!res.ok || data.error)) {
          setStatusMessage(data.error || "Unable to load your saved profile.");
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

  const saveProfileContext = async ({
    nextCvText = cvText,
    nextRoleSpec = roleSpec,
    nextInterviewGoals = interviewGoals,
    nextCvFileName = cvFileName,
    nextRoleSpecFileName = roleSpecFileName,
    successMessage = "Candidate profile saved successfully.",
  }: {
    nextCvText?: string;
    nextRoleSpec?: string;
    nextInterviewGoals?: string;
    nextCvFileName?: string;
    nextRoleSpecFileName?: string;
    successMessage?: string;
  }) => {
    const res = await fetch("/api/candidate-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cvText: nextCvText,
        roleSpec: nextRoleSpec,
        interviewGoals: nextInterviewGoals,
        cvFileName: nextCvFileName,
        roleSpecFileName: nextRoleSpecFileName,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Could not save candidate profile.");
    }

    setCvText(nextCvText);
    setRoleSpec(nextRoleSpec);
    setInterviewGoals(nextInterviewGoals);
    setCvFileName(nextCvFileName);
    setRoleSpecFileName(nextRoleSpecFileName);
    setStatusMessage(successMessage);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMessage("");

      await saveProfileContext({});
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const removeCv = async () => {
    try {
      setRemovingCv(true);
      setStatusMessage("");

      await saveProfileContext({
        nextCvText: "",
        nextCvFileName: "",
        successMessage:
          "CV / career background removed. Your role spec, goals and saved setup preferences were kept.",
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not remove your CV / career background."
      );
    } finally {
      setRemovingCv(false);
    }
  };

  const removeRoleSpec = async () => {
    try {
      setRemovingRoleSpec(true);
      setStatusMessage("");

      await saveProfileContext({
        nextRoleSpec: "",
        nextRoleSpecFileName: "",
        successMessage:
          "Target role specification removed. Your CV, goals and saved setup preferences were kept.",
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not remove your target role specification."
      );
    } finally {
      setRemovingRoleSpec(false);
    }
  };

  const clearProfileContext = async () => {
    try {
      setClearingProfileContext(true);
      setStatusMessage("");

      await saveProfileContext({
        nextCvText: "",
        nextRoleSpec: "",
        nextInterviewGoals: "",
        nextCvFileName: "",
        nextRoleSpecFileName: "",
        successMessage:
          "Profile context cleared. Your saved interview setup, practice mode and speaker preferences were kept.",
      });
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Could not clear your profile context."
      );
    } finally {
      setClearingProfileContext(false);
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

      setStatusMessage(
        `${file.name} processed successfully. Save your profile to keep these changes.`
      );
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
          removingCv={removingCv}
          removingRoleSpec={removingRoleSpec}
          clearingProfileContext={clearingProfileContext}
          statusMessage={statusMessage}
          handleSave={handleSave}
          extractDocumentText={extractDocumentText}
          removeCv={removeCv}
          removeRoleSpec={removeRoleSpec}
          clearProfileContext={clearProfileContext}
        />
      )}
    </MarketingShell>
  );
}