import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { cleanStr, generateSlug } from "../../lib/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId },
      include: {
        company: {
          include: {
            _count: {
              select: {
                members: true,
                templates: true,
                assignments: true,
              },
            },
          },
        },
      },
    });

    if (!member) return NextResponse.json({ company: null, member: null });

    return NextResponse.json({ company: member.company, member: { id: member.id, role: member.role } });
  } catch (error) {
    console.error("COMPANY GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load company." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const existing = await prisma.companyMember.findFirst({ where: { clerkUserId: userId } });
    if (existing) return NextResponse.json({ error: "You are already a member of a company." }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const name = cleanStr(body?.name);
    if (!name) return NextResponse.json({ error: "Company name is required." }, { status: 400 });

    const industry = cleanStr(body?.industry);

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.company.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const company = await prisma.company.create({
      data: {
        name,
        slug,
        industry: industry || null,
        members: {
          create: { clerkUserId: userId, role: "admin" },
        },
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error("COMPANY POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create company." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    // Only admins of the workspace can delete it.
    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: "admin" },
      include: { company: true },
    });
    if (!member) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    // Require the user to type the exact company name to confirm — protects against accidents.
    const body = await request.json().catch(() => ({}));
    const confirmName = cleanStr(body?.confirmName);
    if (!confirmName) {
      return NextResponse.json(
        { error: "Type the company name to confirm deletion." },
        { status: 400 }
      );
    }
    if (confirmName !== member.company.name) {
      return NextResponse.json(
        { error: "Confirmation name does not match the company name." },
        { status: 400 }
      );
    }

    const companyId = member.companyId;

    // Delete in dependency order inside a single transaction. CandidateAssignment.templateId
    // has no cascade so we must remove assignments before templates to avoid FK violations.
    await prisma.$transaction([
      prisma.candidateAssignment.deleteMany({ where: { companyId } }),
      prisma.assessmentTemplate.deleteMany({ where: { companyId } }),
      prisma.companyInvite.deleteMany({ where: { companyId } }),
      prisma.companyMember.deleteMany({ where: { companyId } }),
      prisma.company.delete({ where: { id: companyId } }),
    ]);

    return NextResponse.json({ success: true, deletedCompanyId: companyId });
  } catch (error) {
    console.error("COMPANY DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete company." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: "admin" },
    });
    if (!member) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const name = cleanStr(body?.name);
    const industry = cleanStr(body?.industry);
    const brandColor = cleanStr(body?.brandColor);

    const company = await prisma.company.update({
      where: { id: member.companyId },
      data: {
        ...(name ? { name } : {}),
        ...(industry ? { industry } : {}),
        ...(brandColor ? { brandColor } : {}),
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("COMPANY PATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to update company." }, { status: 500 });
  }
}
