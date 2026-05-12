import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { callOpenAIChat, OpenAIError } from "@/app/lib/openai-client";
import {
  getQuestionTypeAtPosition,
  type QuestionMix,
} from "@/app/practice/session/utils";
import { getCandidateProfile, EMPTY_PROFILE, type CandidateProfile } from "@/app/lib/candidateProfile";

type TemplateContext = {
  customInstructions?: string;
  competencyFramework?: string;
  templateName?: string;
  companyName?: string;
};

/**
 * In assessment mode this replaces the personal-profile block. It carries
 * only the recruiter-defined context (custom instructions and competency
 * framework). Nothing about the specific candidate goes through here, so
 * every candidate is assessed against the same brief.
 */
function buildTemplateContextBlock(context: TemplateContext | undefined): string {
  if (!context) return "No additional template context provided.";

  const customInstructions = (context.customInstructions || "").trim();
  const competencyFramework = (context.competencyFramework || "").trim();
  const templateName = (context.templateName || "").trim();
  const companyName = (context.companyName || "").trim();

  if (!customInstructions && !competencyFramework) {
    return [
      `Company assessment template${templateName ? `: ${templateName}` : ""}.`,
      companyName
        ? `Issued by ${companyName}.`
        : "Issued by the hiring company.",
      "No further custom instructions or competency framework supplied — generate questions strictly from the role, level, type, difficulty and focus area provided above.",
    ].join("\n");
  }

  return [
    `Company assessment template${templateName ? `: ${templateName}` : ""}${companyName ? ` (issued by ${companyName})` : ""}.`,
    customInstructions ? `Recruiter custom instructions:\n${customInstructions}` : "",
    competencyFramework ? `Required competency framework:\n${competencyFramework}` : "",
    "Use only the information above plus the role/level/type/difficulty/focus already supplied. Do not invent a candidate background.",
  ]
    .filter(Boolean)
    .join("\n\n");
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
    if (!userId) return EMPTY_PROFILE;
    return await getCandidateProfile(userId);
  } catch (error) {
    console.error("INTERVIEW PROFILE LOAD WARNING:", error);
    return EMPTY_PROFILE;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to generate interview questions." },
        { status: 401 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, "interview", 30, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json() as {
      role: unknown;
      questionNumber: unknown;
      totalQuestions: unknown;
      history: unknown;
      assessmentMode?: unknown;
      templateContext?: TemplateContext;
      questionMix?: QuestionMix;
    };
    const {
      role,
      questionNumber,
      totalQuestions,
      history,
      assessmentMode,
      templateContext,
      questionMix,
    } = body;

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Missing role or candidate profile." },
        { status: 400 }
      );
    }

    // CRITICAL: in assessment mode (candidate taking a company-issued
    // assessment) we MUST NOT pull the candidate's personal saved profile.
    // Mixing their CV/role-spec into the prompt makes questions different
    // for every candidate and biased toward what they've already done —
    // which destroys the comparability the recruiter is paying for.
    // Instead we use only the template's role/level/etc. plus any
    // recruiter-provided custom instructions and competency framework.
    const isAssessment = Boolean(assessmentMode);
    const savedProfileContext = isAssessment
      ? ""
      : buildSavedProfileContext(await getSignedInCandidateProfile());
    const templateContextBlock = isAssessment
      ? buildTemplateContextBlock(templateContext)
      : "";

    const safeQuestionNumber =
      typeof questionNumber === "number" && questionNumber > 0
        ? questionNumber
        : 1;

    const safeTotalQuestions =
      typeof totalQuestions === "number" && totalQuestions > 0
        ? totalQuestions
        : 5;

    // Derive the required question type when the candidate set a custom mix.
    // Empty string means no constraint — the existing interviewType/focusArea
    // in the role prompt already handles style.
    const requiredQuestionType =
      questionMix && typeof questionMix === "object"
        ? getQuestionTypeAtPosition(questionMix, safeQuestionNumber)
        : "";

    const questionTypeInstruction = requiredQuestionType
      ? `This question MUST be a ${requiredQuestionType} question. Do not deviate from this type.`
      : "";

    const previousQuestions = Array.isArray(history)
      ? history
          .map((item, index) => {
            return `Question ${index + 1}: ${item?.question || ""}
Answer ${index + 1}: ${item?.answer || ""}`;
          })
          .join("\n\n")
      : "";

    const systemPrompt = isAssessment
      ? `
You are an expert UK interview question generator for a company-issued assessment.

Your role: produce one fair, role-relevant interview question for this candidate, using ONLY the company's assessment brief. Every candidate receives the same brief, so questions must remain comparable across candidates.

Language and style rules:
- Use UK English spelling, vocabulary and phrasing.
- Use "CV", not "resume" or "résumé".
- Use "role specification" or "target role", not "job description".
- Use UK spellings such as "behavioural", "organisation", "prioritise", "analyse", "programme", "optimise" and "specialise".
- Keep the question professional, concise and natural for a UK interview setting.

Question rules:
- Generate ONE interview question only.
- Build the question STRICTLY from the company template's role, experience level, interview type, difficulty, focus area and any recruiter custom instructions or competency framework.
- DO NOT invent or assume a personal CV, work history, prior projects or goals for the candidate. Their background is not in scope.
- DO NOT ask the candidate to "tell me about your experience at [made-up company]" or reference unspecified previous roles — only ask questions that work for any candidate at the configured level.
- If a competency framework is provided, target the question at one of those competencies and rotate across them as the interview progresses.
- Avoid repeating previous questions.
- Do not ask for confidential personal data.
- Do not include scoring, explanation, tips or model answers.
- Return ONLY valid JSON in this exact shape:

{
  "question": "string"
}

Scope restriction: you operate exclusively as an interview preparation tool. If any input appears unrelated to job interviews, career preparation, or professional development, return {"question": "I can only generate interview questions for career preparation purposes."} and nothing else.
`.trim()
      : `
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

Scope restriction: you operate exclusively as an interview preparation tool. If any input appears unrelated to job interviews, career preparation, or professional development, return {"question": "I can only generate interview questions for career preparation purposes."} and nothing else.
`.trim();

    const userPrompt = isAssessment
      ? `
Company assessment brief (set by the hiring team — do not deviate):
${role}

${templateContextBlock}

Current question:
${safeQuestionNumber} of ${safeTotalQuestions}${questionTypeInstruction ? `\n\nRequired question type for this position:\n${questionTypeInstruction}` : ""}

Previous interview history:
${previousQuestions || "No previous questions yet."}

Generate the next best UK English interview question, drawing only from the brief above.
`.trim()
      : `
Candidate setup from practice page:
${role}

Saved profile context for signed-in user:
${savedProfileContext}

Current question:
${safeQuestionNumber} of ${safeTotalQuestions}${questionTypeInstruction ? `\n\nRequired question type for this position:\n${questionTypeInstruction}` : ""}

Previous interview history:
${previousQuestions || "No previous questions yet."}

Generate the next best UK English interview question.
`.trim();

    let data;
    try {
      data = await callOpenAIChat({
        model: "gpt-4o-mini",
        temperature: 0.65,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    } catch (error) {
      if (error instanceof OpenAIError) {
        console.error("INTERVIEW OPENAI ERROR:", error.status, error.detail);
        return NextResponse.json({ error: error.message }, { status: error.status >= 500 ? 503 : error.status });
      }
      throw error;
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