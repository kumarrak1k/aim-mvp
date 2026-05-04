import { auth, clerkClient } from "@clerk/nextjs/server";

type PracticeMode = "typed" | "voice" | "voice-camera";
type SpeakerVoice = "female" | "male" | "neutral";
type SpeakerAccent = "british" | "american" | "neutral";
type SpeakerPace = "slow" | "natural" | "energetic";

type SpeakerPreference = {
  voice: SpeakerVoice;
  accent: SpeakerAccent;
  pace: SpeakerPace;
};

type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  preferredPracticeMode: PracticeMode;
  speakerPreference: SpeakerPreference;
  updatedAt: string;
};

const DEFAULT_SPEAKER_PREFERENCE: SpeakerPreference = {
  voice: "female",
  accent: "british",
  pace: "natural",
};

const EMPTY_PROFILE: CandidateProfile = {
  cvText: "",
  roleSpec: "",
  interviewGoals: "",
  cvFileName: "",
  roleSpecFileName: "",
  preferredPracticeMode: "typed",
  speakerPreference: DEFAULT_SPEAKER_PREFERENCE,
  updatedAt: "",
};

const PRACTICE_MODES: PracticeMode[] = ["typed", "voice", "voice-camera"];
const SPEAKER_VOICES: SpeakerVoice[] = ["female", "male", "neutral"];
const SPEAKER_ACCENTS: SpeakerAccent[] = ["british", "american", "neutral"];
const SPEAKER_PACES: SpeakerPace[] = ["slow", "natural", "energetic"];

const MAX_CV_CHARS = 3500;
const MAX_ROLE_SPEC_CHARS = 2500;
const MAX_GOALS_CHARS = 900;
const MAX_TOTAL_CHARS = 7000;
const MAX_FILENAME_CHARS = 180;

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
}

function cleanFileName(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .trim()
    .slice(0, MAX_FILENAME_CHARS);
}

function cleanPracticeMode(
  value: unknown,
  fallback: PracticeMode = "typed"
): PracticeMode {
  if (typeof value !== "string") return fallback;
  return PRACTICE_MODES.includes(value as PracticeMode)
    ? (value as PracticeMode)
    : fallback;
}

function cleanSpeakerPreference(
  value: unknown,
  fallback: SpeakerPreference = DEFAULT_SPEAKER_PREFERENCE
): SpeakerPreference {
  const input = value as Partial<SpeakerPreference> | undefined;

  return {
    voice:
      typeof input?.voice === "string" &&
      SPEAKER_VOICES.includes(input.voice as SpeakerVoice)
        ? (input.voice as SpeakerVoice)
        : fallback.voice,
    accent:
      typeof input?.accent === "string" &&
      SPEAKER_ACCENTS.includes(input.accent as SpeakerAccent)
        ? (input.accent as SpeakerAccent)
        : fallback.accent,
    pace:
      typeof input?.pace === "string" &&
      SPEAKER_PACES.includes(input.pace as SpeakerPace)
        ? (input.pace as SpeakerPace)
        : fallback.pace,
  };
}

function trimToLimit(value: string, limit: number) {
  if (value.length <= limit) {
    return {
      value,
      wasTrimmed: false,
    };
  }

  return {
    value: value.slice(0, limit).trim(),
    wasTrimmed: true,
  };
}

function extractCandidateProfile(metadata: unknown): CandidateProfile {
  const data = metadata as {
    candidateProfile?: Partial<CandidateProfile>;
  };

  const candidateProfile = data?.candidateProfile;

  if (!candidateProfile || typeof candidateProfile !== "object") {
    return EMPTY_PROFILE;
  }

  return {
    cvText: cleanText(candidateProfile.cvText).slice(0, MAX_CV_CHARS).trim(),
    roleSpec: cleanText(candidateProfile.roleSpec)
      .slice(0, MAX_ROLE_SPEC_CHARS)
      .trim(),
    interviewGoals: cleanText(candidateProfile.interviewGoals)
      .slice(0, MAX_GOALS_CHARS)
      .trim(),
    cvFileName: cleanFileName(candidateProfile.cvFileName),
    roleSpecFileName: cleanFileName(candidateProfile.roleSpecFileName),
    preferredPracticeMode: cleanPracticeMode(
      candidateProfile.preferredPracticeMode,
      "typed"
    ),
    speakerPreference: cleanSpeakerPreference(
      candidateProfile.speakerPreference,
      DEFAULT_SPEAKER_PREFERENCE
    ),
    updatedAt:
      typeof candidateProfile.updatedAt === "string"
        ? candidateProfile.updatedAt
        : "",
  };
}

function normaliseProfile(body: unknown, currentProfile: CandidateProfile) {
  const input = body as Partial<CandidateProfile>;

  const rawCvText =
    typeof input.cvText === "string"
      ? cleanText(input.cvText)
      : currentProfile.cvText;
  const rawRoleSpec =
    typeof input.roleSpec === "string"
      ? cleanText(input.roleSpec)
      : currentProfile.roleSpec;
  const rawInterviewGoals =
    typeof input.interviewGoals === "string"
      ? cleanText(input.interviewGoals)
      : currentProfile.interviewGoals;

  const cvText = trimToLimit(rawCvText, MAX_CV_CHARS);
  const roleSpec = trimToLimit(rawRoleSpec, MAX_ROLE_SPEC_CHARS);
  const interviewGoals = trimToLimit(rawInterviewGoals, MAX_GOALS_CHARS);

  const profile: CandidateProfile = {
    cvText: cvText.value,
    roleSpec: roleSpec.value,
    interviewGoals: interviewGoals.value,
    cvFileName:
      typeof input.cvFileName === "string"
        ? cleanFileName(input.cvFileName)
        : currentProfile.cvFileName,
    roleSpecFileName:
      typeof input.roleSpecFileName === "string"
        ? cleanFileName(input.roleSpecFileName)
        : currentProfile.roleSpecFileName,
    preferredPracticeMode: cleanPracticeMode(
      input.preferredPracticeMode,
      currentProfile.preferredPracticeMode || "typed"
    ),
    speakerPreference: cleanSpeakerPreference(
      input.speakerPreference,
      currentProfile.speakerPreference || DEFAULT_SPEAKER_PREFERENCE
    ),
    updatedAt: new Date().toISOString(),
  };

  const trimWarnings: string[] = [];

  if (cvText.wasTrimmed) {
    trimWarnings.push(
      `CV / career background was automatically trimmed to ${MAX_CV_CHARS.toLocaleString()} characters.`
    );
  }

  if (roleSpec.wasTrimmed) {
    trimWarnings.push(
      `Role spec was automatically trimmed to ${MAX_ROLE_SPEC_CHARS.toLocaleString()} characters.`
    );
  }

  if (interviewGoals.wasTrimmed) {
    trimWarnings.push(
      `Interview goals were automatically trimmed to ${MAX_GOALS_CHARS.toLocaleString()} characters.`
    );
  }

  return {
    profile,
    trimWarnings,
  };
}

function validateProfile(profile: CandidateProfile) {
  const totalLength =
    profile.cvText.length +
    profile.roleSpec.length +
    profile.interviewGoals.length;

  if (totalLength > MAX_TOTAL_CHARS) {
    return `Profile is too long overall. Please keep the total under ${MAX_TOTAL_CHARS.toLocaleString()} characters for this first version.`;
  }

  return "";
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "You must be signed in to view your candidate profile." },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    return Response.json({
      profile: extractCandidateProfile(user.privateMetadata),
      limits: {
        cvText: MAX_CV_CHARS,
        roleSpec: MAX_ROLE_SPEC_CHARS,
        interviewGoals: MAX_GOALS_CHARS,
        total: MAX_TOTAL_CHARS,
      },
    });
  } catch (error) {
    console.error("CANDIDATE PROFILE GET ERROR:", error);

    return Response.json(
      { error: "Failed to load candidate profile." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: "You must be signed in to save your candidate profile." },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentProfile = extractCandidateProfile(user.privateMetadata);

    const body = await req.json();
    const { profile, trimWarnings } = normaliseProfile(body, currentProfile);
    const validationError = validateProfile(profile);

    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        candidateProfile: profile,
      },
    });

    return Response.json({
      profile,
      message:
        trimWarnings.length > 0
          ? `Candidate profile saved. ${trimWarnings.join(" ")}`
          : "Candidate profile saved.",
      trimWarnings,
      limits: {
        cvText: MAX_CV_CHARS,
        roleSpec: MAX_ROLE_SPEC_CHARS,
        interviewGoals: MAX_GOALS_CHARS,
        total: MAX_TOTAL_CHARS,
      },
    });
  } catch (error) {
    console.error("CANDIDATE PROFILE POST ERROR:", error);

    return Response.json(
      { error: "Failed to save candidate profile." },
      { status: 500 }
    );
  }
}