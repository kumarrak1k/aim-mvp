import { auth } from "@clerk/nextjs/server";
import {
  getCandidateProfile,
  upsertCandidateProfile,
  deleteCandidateProfile,
  EMPTY_PROFILE,
  type CandidateProfile,
} from "@/app/lib/candidateProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CV_CHARS = 3500;
const MAX_ROLE_SPEC_CHARS = 2500;
const MAX_GOALS_CHARS = 900;
const MAX_TOTAL_CHARS = 7000;

function validateTotalLength(profile: Partial<CandidateProfile>): string {
  const total =
    (profile.cvText?.length ?? 0) +
    (profile.roleSpec?.length ?? 0) +
    (profile.interviewGoals?.length ?? 0);
  if (total > MAX_TOTAL_CHARS) {
    return `Profile is too long overall. Please keep the total under ${MAX_TOTAL_CHARS.toLocaleString()} characters.`;
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

    const profile = await getCandidateProfile(userId);

    return Response.json({
      profile,
      limits: {
        cvText: MAX_CV_CHARS,
        roleSpec: MAX_ROLE_SPEC_CHARS,
        interviewGoals: MAX_GOALS_CHARS,
        total: MAX_TOTAL_CHARS,
      },
    });
  } catch (error) {
    console.error("CANDIDATE PROFILE GET ERROR:", error);
    return Response.json({ error: "Failed to load candidate profile." }, { status: 500 });
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

    const body = await req.json() as Partial<CandidateProfile>;

    // Trim individual fields first so the total-length check operates on the
    // values that will actually be stored, not the raw (potentially longer) input.
    const trimWarnings: string[] = [];
    if (typeof body.cvText === "string" && body.cvText.length > MAX_CV_CHARS) {
      body.cvText = body.cvText.slice(0, MAX_CV_CHARS);
      trimWarnings.push(`CV was automatically trimmed to ${MAX_CV_CHARS.toLocaleString()} characters.`);
    }
    if (typeof body.roleSpec === "string" && body.roleSpec.length > MAX_ROLE_SPEC_CHARS) {
      body.roleSpec = body.roleSpec.slice(0, MAX_ROLE_SPEC_CHARS);
      trimWarnings.push(`Role spec was automatically trimmed to ${MAX_ROLE_SPEC_CHARS.toLocaleString()} characters.`);
    }
    if (typeof body.interviewGoals === "string" && body.interviewGoals.length > MAX_GOALS_CHARS) {
      body.interviewGoals = body.interviewGoals.slice(0, MAX_GOALS_CHARS);
      trimWarnings.push(`Interview goals were automatically trimmed to ${MAX_GOALS_CHARS.toLocaleString()} characters.`);
    }

    const validationError = validateTotalLength(body);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const profile = await upsertCandidateProfile(userId, body);

    return Response.json({
      profile,
      message: trimWarnings.length > 0
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
    return Response.json({ error: "Failed to save candidate profile." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { error: "You must be signed in to clear your candidate profile." },
        { status: 401 }
      );
    }

    await deleteCandidateProfile(userId);

    return Response.json({
      success: true,
      profile: EMPTY_PROFILE,
      message: "Candidate profile cleared.",
    });
  } catch (error) {
    console.error("CANDIDATE PROFILE DELETE ERROR:", error);
    return Response.json({ error: "Failed to clear candidate profile." }, { status: 500 });
  }
}
