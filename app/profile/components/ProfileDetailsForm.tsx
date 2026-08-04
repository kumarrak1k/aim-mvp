"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import Link from "next/link";
import {
  GlassCard,
  SectionHeading,
} from "@/app/components/marketing/primitives";
import type { ProfileUploadTarget } from "../types";

type ProfileDetailsFormProps = {
  cvText: string;
  setCvText: Dispatch<SetStateAction<string>>;
  roleSpec: string;
  setRoleSpec: Dispatch<SetStateAction<string>>;
  interviewGoals: string;
  setInterviewGoals: Dispatch<SetStateAction<string>>;
  cvFileName: string;
  roleSpecFileName: string;
  loading: boolean;
  saving: boolean;
  extractingCv: boolean;
  extractingRole: boolean;
  removingCv: boolean;
  removingRoleSpec: boolean;
  clearingProfileContext: boolean;
  deletingPracticeSessions: boolean;
  deletingAllAimData: boolean;
  exportingData: boolean;
  statusMessage: string;
  handleSave: () => Promise<void>;
  extractDocumentText: (
    file: File,
    target: ProfileUploadTarget
  ) => Promise<void>;
  removeCv: () => Promise<void>;
  removeRoleSpec: () => Promise<void>;
  clearProfileContext: () => Promise<void>;
  deletePracticeSessions: () => Promise<void>;
  deleteAllAimData: () => Promise<void>;
  exportAccountData: () => Promise<void>;
};

export function ProfileDetailsForm({
  cvText,
  setCvText,
  roleSpec,
  setRoleSpec,
  interviewGoals,
  setInterviewGoals,
  cvFileName,
  roleSpecFileName,
  loading,
  saving,
  extractingCv,
  extractingRole,
  removingCv,
  removingRoleSpec,
  clearingProfileContext,
  deletingPracticeSessions,
  deletingAllAimData,
  exportingData,
  statusMessage,
  handleSave,
  extractDocumentText,
  removeCv,
  removeRoleSpec,
  clearProfileContext,
  deletePracticeSessions,
  deleteAllAimData,
  exportAccountData,
}: ProfileDetailsFormProps) {
  const hasCvContext = Boolean(cvText.trim() || cvFileName);
  const hasRoleSpecContext = Boolean(roleSpec.trim() || roleSpecFileName);
  const hasAnyProfileContext = Boolean(
    cvText.trim() ||
      roleSpec.trim() ||
      interviewGoals.trim() ||
      cvFileName ||
      roleSpecFileName
  );

  const destructiveActionRunning =
    removingCv ||
    removingRoleSpec ||
    clearingProfileContext ||
    deletingPracticeSessions ||
    deletingAllAimData;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold tracking-wide text-cyan-300">
              Your information
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Candidate profile details
            </h2>
            <p className="mt-3 text-base leading-8 text-gray-300">
              Add or upload your profile context below. This will be used to
              personalise mock interviews and practice feedback.
            </p>
          </div>

          <div className="mb-6 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
            <p className="text-sm font-bold text-cyan-100">
              Privacy notice
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Your uploaded files are converted into text for interview
              personalisation. Raw files are not stored by this profile page.
              You can remove CV context, role context, saved sessions, or all
              AI Career Mentor data from the controls below.
            </p>
          </div>

          {statusMessage && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-gray-200">
              {statusMessage}
            </div>
          )}

          {loading ? (
            <p className="text-gray-300">Loading your profile...</p>
          ) : (
            <div className="space-y-6">
              <ProfileField
                label="CV / background"
                helper="Paste your CV content, career summary or upload a file."
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.12]">
                    {extractingCv ? "Processing CV..." : "Upload CV"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void extractDocumentText(file, "cv");
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  {hasCvContext && (
                    <button
                      type="button"
                      onClick={() => void removeCv()}
                      disabled={removingCv || saving || destructiveActionRunning}
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingCv ? "Removing..." : "Remove CV"}
                    </button>
                  )}

                  {cvFileName && (
                    <span className="text-sm text-gray-400">
                      Current file: {cvFileName}
                    </span>
                  )}
                </div>

                <textarea
                  value={cvText}
                  onChange={(event) => setCvText(event.target.value)}
                  placeholder="Paste your CV text, work experience, education and key achievements..."
                  className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                />
              </ProfileField>

              <ProfileField
                label="Target role specification"
                helper="Add the job description or requirements for the role you are preparing for."
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.12]">
                    {extractingRole
                      ? "Processing role spec..."
                      : "Upload role spec"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void extractDocumentText(file, "roleSpec");
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  {hasRoleSpecContext && (
                    <button
                      type="button"
                      onClick={() => void removeRoleSpec()}
                      disabled={
                        removingRoleSpec || saving || destructiveActionRunning
                      }
                      className="inline-flex items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingRoleSpec ? "Removing..." : "Remove role spec"}
                    </button>
                  )}

                  {roleSpecFileName && (
                    <span className="text-sm text-gray-400">
                      Current file: {roleSpecFileName}
                    </span>
                  )}
                </div>

                <textarea
                  value={roleSpec}
                  onChange={(event) => setRoleSpec(event.target.value)}
                  placeholder="Paste the job description, responsibilities, requirements or employer expectations..."
                  className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                />
              </ProfileField>

              <ProfileField
                label="Interview goals"
                helper="State what you want to improve, such as confidence, STAR structure, concise answers or leadership examples."
              >
                <textarea
                  value={interviewGoals}
                  onChange={(event) => setInterviewGoals(event.target.value)}
                  placeholder="Example: I want stronger behavioural answers, better confidence, and clearer leadership examples."
                  className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
                />
              </ProfileField>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || destructiveActionRunning}
                  className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-7 py-4 text-sm font-bold text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Candidate Profile"}
                </button>

                <Link
                  href="/practice"
                  className="rounded-2xl border border-white/10 bg-white/[0.07] px-7 py-4 text-center text-sm font-bold text-white transition hover:bg-white/[0.12]"
                >
                  Go to practice
                </Link>
              </div>

              {hasAnyProfileContext && (
                <div className="rounded-[1.5rem] border border-rose-300/15 bg-rose-300/10 p-5">
                  <p className="text-sm font-bold text-rose-100">
                    Remove saved profile context
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    This clears your CV, target role specification, interview
                    goals and uploaded file names. Your saved practice mode,
                    speaker preference and default interview setup are kept.
                  </p>

                  <button
                    type="button"
                    onClick={() => void clearProfileContext()}
                    disabled={
                      clearingProfileContext ||
                      saving ||
                      deletingPracticeSessions ||
                      deletingAllAimData
                    }
                    className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-300/10 px-5 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {clearingProfileContext
                      ? "Clearing..."
                      : "Clear all profile context"}
                  </button>
                </div>
              )}

              <PrivacyControls
                deletingPracticeSessions={deletingPracticeSessions}
                deletingAllAimData={deletingAllAimData}
                exportingData={exportingData}
                saving={saving}
                clearProfileContextRunning={clearingProfileContext}
                onDeletePracticeSessions={deletePracticeSessions}
                onDeleteAllAimData={deleteAllAimData}
                onExportAccountData={exportAccountData}
              />
            </div>
          )}
        </GlassCard>

        <ProfileSidebar />
      </div>
    </section>
  );
}

function PrivacyControls({
  deletingPracticeSessions,
  deletingAllAimData,
  exportingData,
  saving,
  clearProfileContextRunning,
  onDeletePracticeSessions,
  onDeleteAllAimData,
  onExportAccountData,
}: {
  deletingPracticeSessions: boolean;
  deletingAllAimData: boolean;
  exportingData: boolean;
  saving: boolean;
  clearProfileContextRunning: boolean;
  onDeletePracticeSessions: () => Promise<void>;
  onDeleteAllAimData: () => Promise<void>;
  onExportAccountData: () => Promise<void>;
}) {
  const anyActionRunning =
    deletingPracticeSessions ||
    deletingAllAimData ||
    exportingData ||
    saving ||
    clearProfileContextRunning;

  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
      <p className="text-sm font-bold tracking-wide text-amber-200">
        Privacy & data controls
      </p>
      <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
        Manage saved AI Career Mentor data.
      </h3>
      <p className="mt-2 text-sm leading-6 text-gray-400">
        Saved practice sessions can include answers, transcripts, feedback,
        summaries, scores and derived voice/camera metrics. Export a copy of
        your data, delete saved sessions, or clear all data linked to your account.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => void onExportAccountData()}
          disabled={anyActionRunning}
          className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-left text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exportingData ? "Exporting..." : "Export my data"}
          <span className="mt-2 block text-xs font-semibold leading-5 text-gray-400">
            Download profile and saved sessions as a JSON file.
          </span>
        </button>

        <button
          type="button"
          onClick={() => void onDeletePracticeSessions()}
          disabled={anyActionRunning}
          className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-5 py-4 text-left text-sm font-bold text-rose-100 transition hover:bg-rose-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletingPracticeSessions
            ? "Deleting sessions..."
            : "Delete saved practice sessions"}
          <span className="mt-2 block text-xs font-semibold leading-5 text-gray-400">
            Removes saved answers, feedback, summaries and progress history.
          </span>
        </button>

        <button
          type="button"
          onClick={() => void onDeleteAllAimData()}
          disabled={anyActionRunning}
          className="rounded-2xl border border-red-300/25 bg-red-300/10 px-5 py-4 text-left text-sm font-bold text-red-100 transition hover:bg-red-300/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletingAllAimData ? "Deleting all AI Career Mentor data..." : "Delete all AI Career Mentor data"}
          <span className="mt-2 block text-xs font-semibold leading-5 text-gray-400">
            Clears candidate profile context and deletes saved practice
            sessions. This cannot be undone.
          </span>
        </button>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-white">{label}</label>
      <p className="mb-3 text-sm leading-6 text-gray-400">{helper}</p>
      {children}
    </div>
  );
}

function ProfileSidebar() {
  return (
    <div className="space-y-6">
      <GlassCard className="overflow-hidden p-0">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80"
          alt="Professional workspace for candidate preparation"
          className="h-[250px] w-full object-cover"
        />
        <div className="p-6">
          <p className="text-sm font-bold tracking-wide text-purple-300">
            Why this matters
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight">
            Better context. Better questions. Better feedback.
          </h3>
          <p className="mt-4 text-sm leading-7 text-gray-300">
            A strong candidate profile helps the platform generate more relevant
            questions and more useful coaching feedback.
          </p>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeading
          eyebrow="Best practice"
          title="Make the profile specific."
          description="The more specific your profile, the more useful your tailored interview practice becomes."
        />

        <ul className="mt-5 space-y-3 text-sm leading-7 text-gray-300">
          <li>• Add a clear CV or career summary</li>
          <li>• Include the target job description</li>
          <li>• Note the skills or examples you want to improve</li>
          <li>• Save the profile before starting practice</li>
        </ul>
      </GlassCard>

      <GlassCard>
        <SectionHeading
          eyebrow="Privacy"
          title="You stay in control."
          description="Remove profile context or saved session history whenever you need to. Avoid uploading sensitive or third-party information that is not needed for interview practice."
        />

        <div className="mt-5 space-y-3 text-sm leading-7 text-gray-300">
          <p>• CV and role uploads are converted into text context.</p>
          <p>• Completed sessions may store answers, feedback and scores.</p>
          <p>• Voice recordings and camera video should not be stored by AI Career Mentor.</p>
          <p>• You can delete saved practice history from this page.</p>
        </div>
      </GlassCard>
    </div>
  );
}