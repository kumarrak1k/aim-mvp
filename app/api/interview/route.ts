import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  updatedAt: string;
};

const EMPTY_PROFILE: CandidateProfile = {
  cvText: "",
  roleSpec: "",
  interviewGoals: "",
  cvFileName: "",
  roleSpecFileName: "",
  updatedAt: "",
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
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
    cvText: cleanText(candidateProfile.cvText),
    roleSpec: cleanText(candidateProfile.roleSpec),
    interviewGoals: cleanText(candidateProfile.interviewGoals),
    cvFileName: cleanText(candidateProfile.cvFileName),
    roleSpecFileName: cleanText(candidateProfile.roleSpecFileName),
    updatedAt: cleanText(candidateProfile.updatedAt),
  };
}

function buildSavedProfileContext(profile: CandidateProfile) {
  const hasProfile =
    profile.cvText.trim() ||
    profile.roleSpec.trim() ||
    profile.interviewGoals.trim();

  if (!hasProfile) {
    return "No saved candidate profile has been added yet.";
  }

  return `
Saved candidate profile context:

CV / career background:
${profile.cvText || "Not provided."}

Target role specification:
${profile.roleSpec || "Not provided."}

Candidate interview goals:
${profile.interviewGoals || "Not provided."}

Uploaded CV file:
${profile.cvFileName || "Not provided."}

Uploaded role specification file:
${profile.roleSpecFileName || "Not provided."}

Profile last updated:
${profile.updatedAt || "Unknown."}
`.trim();
}

function normaliseQuestionToUkEnglish(question: string) {
  return question
    .replace(/\bresume\b/gi, "CV")
    .replace(/\brésumé\b/gi, "CV")
    .replace(/\bbehavioral\b/gi, "behavioural")
    .replace(/\bbehavior\b/gi, "behaviour")
    .replace(/\bprioritize\b/gi, "prioritise")
    .replace(/\bprioritized\b/gi, "prioritised")
    .replace(/\bprioritizing\b/gi, "prioritising")
    .replace(/\banalyze\b/gi, "analyse")
    .replace(/\banalyzed\b/gi, "analysed")
    .replace(/\banalyzing\b/gi, "analysing")
    .replace(/\borganization\b/gi, "organisation")
    .replace(/\borganizations\b/gi, "organisations")
    .replace(/\borganize\b/gi, "organise")
    .replace(/\borganized\b/gi, "organised")
    .replace(/\borganizing\b/gi, "organising")
    .replace(/\boptimize\b/gi, "optimise")
    .replace(/\boptimized\b/gi, "optimised")
    .replace(/\boptimizing\b/gi, "optimising")
    .replace(/\butilize\b/gi, "use")
    .replace(/\butilized\b/gi, "used")
    .replace(/\butilizing\b/gi, "using")
    .replace(/\bprogram\b/gi, "programme")
    .replace(/\bprograms\b/gi, "programmes")
    .replace(/\bjob description\b/gi, "role specification")
    .replace(/\bcover letter\b/gi, "covering letter")
    .replace(/\s+/g, " ")
    .trim();
}

async function getSignedInCandidateProfile() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return EMPTY_PROFILE;
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    return extractCandidateProfile(user.privateMetadata);
  } catch (error) {
    console.error("INTERVIEW PROFILE LOAD WARNING:", error);
    return EMPTY_PROFILE;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { role, questionNumber, totalQuestions, history } = await req.json();

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Missing role or candidate profile." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing from environment variables." },
        { status: 500 }
      );
    }

    const savedProfile = await getSignedInCandidateProfile();
    const savedProfileContext = buildSavedProfileContext(savedProfile);

    const safeQuestionNumber =
      typeof questionNumber === "number" && questionNumber > 0
        ? questionNumber
        : 1;

    const safeTotalQuestions =
      typeof totalQuestions === "number" && totalQuestions > 0
        ? totalQuestions
        : 5;

    const previousQuestions = Array.isArray(history)
      ? history
          .map((item, index) => {
            return `Question ${index + 1}: ${item?.question || ""}
Answer ${index + 1}: ${item?.answer || ""}`;
          })
          .join("\n\n")
      : "";

    const systemPrompt = `
You are an expert UK interview question generator for AI Career Mentor.

Your job is to create realistic, high-quality interview questions for candidates preparing for professional interviews in a UK English style.

Language and style rules:
- Use UK English spelling, vocabulary and phrasing.
- Use "CV", not "resume" or "résumé".
- Use "role specification" or "target role", not "job description" where possible.
- Use UK spellings such as "behavioural", "organisation", "prioritise", "analyse", "programme", "optimise" and "specialise".
- Do not use American-style phrasing unless it appears inside the candidate's own provided role context.
- Keep the question professional, concise and natural for a UK interview setting.

Interview question rules:
- Generate ONE interview question only.
- The question must match the candidate profile, interview type, difficulty and focus area.
- If saved CV, role specification or interview goals are provided, use them to make the question more personalised and relevant.
- Prioritise the target role specification over generic role assumptions.
- Use the CV context to ask questions that let the candidate draw on their own likely experience, achievements and examples.
- Use the candidate's interview goals to adjust the focus of the question.
- Avoid repeating previous questions.
- Do not ask for confidential personal data.
- Do not mention that you can see private metadata, saved profile data or uploaded files.
- Do not include scoring, explanation, tips or model answers.
- Make the question clear, realistic and useful for interview practice.
- Return ONLY valid JSON in this exact shape:

{
  "question": "string"
}
`.trim();

    const userPrompt = `
Candidate setup from practice page:
${role}

Saved profile context for signed-in user:
${savedProfileContext}

Current question:
${safeQuestionNumber} of ${safeTotalQuestions}

Previous interview history:
${previousQuestions || "No previous questions yet."}

Generate the next best UK English interview question.
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.65,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "OpenAI request failed while generating the question.",
        },
        { status: 500 }
      );
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "No question was returned by the AI." },
        { status: 500 }
      );
    }

    let parsed: { question?: string };

    try {
      const cleanedText = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      parsed = JSON.parse(cleanedText);
    } catch {
      parsed = {
        question: text.trim(),
      };
    }

    if (!parsed.question || typeof parsed.question !== "string") {
      return NextResponse.json(
        { error: "AI response did not include a valid question." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      question: normaliseQuestionToUkEnglish(parsed.question),
    });
  } catch (error) {
    console.error("INTERVIEW QUESTION API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the question." },
      { status: 500 }
    );
  }
}