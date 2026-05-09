import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { authenticateApiKey } from "../../../lib/apiAuth";
import { sendCandidateInvite } from "../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/candidates — list all assignments for the company
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
  const status = searchParams.get("status"); // optional filter

  const where = {
    companyId: auth.companyId,
    ...(status ? { status } : {}),
  };

  const [total, assignments] = await Promise.all([
    prisma.candidateAssignment.count({ where }),
    prisma.candidateAssignment.findMany({
      where,
      include: {
        template: { select: { id: true, name: true, role: true, questionCount: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Resolve session scores in one query
  const sessionIds = assignments
    .map((a) => a.sessionId)
    .filter((id): id is string => Boolean(id));

  const sessions = sessionIds.length
    ? await prisma.practiceSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, overallScore: true, hireSignal: true, createdAt: true },
      })
    : [];
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const data = assignments.map((a) => {
    const session = a.sessionId ? sessionMap.get(a.sessionId) : null;
    return {
      id: a.id,
      candidateEmail: a.candidateEmail,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      startedAt: a.startedAt?.toISOString() ?? null,
      completedAt: a.completedAt?.toISOString() ?? null,
      expiresAt: a.expiresAt.toISOString(),
      template: a.template,
      result: session
        ? {
            overallScore: session.overallScore,
            hireSignal: session.hireSignal,
            completedAt: session.createdAt.toISOString(),
          }
        : null,
    };
  });

  return NextResponse.json({ data, total, page, pageSize });
}

// POST /api/v1/candidates — invite a candidate
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const { candidateEmail, templateId, expiryDays = 7 } = body as Record<string, unknown>;

  if (typeof candidateEmail !== "string" || !candidateEmail.includes("@")) {
    return NextResponse.json({ error: "candidateEmail must be a valid email." }, { status: 400 });
  }
  if (typeof templateId !== "string" || !templateId) {
    return NextResponse.json({ error: "templateId is required." }, { status: 400 });
  }
  const expiry = typeof expiryDays === "number" ? Math.min(30, Math.max(1, expiryDays)) : 7;

  const [template, company] = await Promise.all([
    prisma.assessmentTemplate.findFirst({
      where: { id: templateId, companyId: auth.companyId, isActive: true },
    }),
    prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { name: true, brandColor: true },
    }),
  ]);

  if (!template) return NextResponse.json({ error: "Template not found or inactive." }, { status: 404 });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  const expiresAt = new Date(Date.now() + expiry * 24 * 60 * 60 * 1000);

  const assignment = await prisma.candidateAssignment.create({
    data: { companyId: auth.companyId, templateId, candidateEmail, expiresAt },
    include: { template: { select: { id: true, name: true, role: true, questionCount: true } } },
  });

  const sendResult = await sendCandidateInvite({
    to: candidateEmail,
    companyName: company.name,
    companyBrandColor: company.brandColor,
    templateName: template.name,
    roleTitle: template.role,
    inviteToken: assignment.inviteToken,
    expiresAt,
  });

  await prisma.candidateAssignment.update({
    where: { id: assignment.id },
    data: sendResult.ok
      ? { emailSent: true, emailSentAt: new Date(), emailMessageId: sendResult.id, emailSendCount: { increment: 1 } }
      : { emailSent: false, emailError: sendResult.error.slice(0, 500), emailSendCount: { increment: 1 } },
  });

  return NextResponse.json(
    {
      id: assignment.id,
      candidateEmail: assignment.candidateEmail,
      status: assignment.status,
      expiresAt: assignment.expiresAt.toISOString(),
      template: assignment.template,
      emailSent: sendResult.ok,
    },
    { status: 201 }
  );
}
