import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/company/join?token=TOKEN
 *
 * Public — no auth required. Returns basic invite info so the join page
 * can display the company name and role before the user accepts.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const invite = await prisma.companyInvite.findUnique({
    where: { token },
    include: { company: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  if (invite.used) {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
  }

  return NextResponse.json({
    invite: {
      companyName: invite.company.name,
      role: invite.role,
      email: invite.email,
      expiresAt: invite.expiresAt,
    },
  });
}

/**
 * POST /api/company/join
 *
 * Auth required. Accepts a workspace invite and creates a CompanyMember
 * record for the signed-in user.
 *
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to accept an invite." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : null;
    if (!token) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const invite = await prisma.companyInvite.findUnique({
      where: { token },
      include: { company: { select: { id: true, name: true } } },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    if (invite.used) {
      return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite link has expired. Ask your admin to send a new one." }, { status: 410 });
    }

    // Prevent joining a second workspace
    const existingMembership = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId },
    });
    if (existingMembership) {
      if (existingMembership.companyId === invite.companyId) {
        return NextResponse.json(
          { error: "You are already a member of this workspace." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "You are already a member of another workspace. A user can only belong to one workspace." },
        { status: 409 }
      );
    }

    // Create membership and mark invite used in a transaction
    await prisma.$transaction([
      prisma.companyMember.create({
        data: {
          companyId: invite.companyId,
          clerkUserId: userId,
          role: invite.role,
        },
      }),
      prisma.companyInvite.update({
        where: { id: invite.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      companyName: invite.company.name,
      role: invite.role,
    });
  } catch (error) {
    console.error("COMPANY JOIN ERROR:", error);
    return NextResponse.json({ error: "Failed to accept invite." }, { status: 500 });
  }
}
