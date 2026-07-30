import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.assessmentCentreSession.findUnique({
    where: { id },
  });

  if (!session || session.clerkUserId !== userId) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json(session);
}

/**
 * Delete one assessment centre session.
 *
 * Mirrors the practice-session delete: users could not remove a run they did
 * not want kept, which for stored performance data is a gap in its own right
 * as well as a GDPR one.
 *
 * Ownership is enforced the same way GET does it — an id belonging to another
 * user returns 404 rather than 403, so the endpoint does not confirm that a
 * session exists to someone who cannot see it.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.assessmentCentreSession.findUnique({
    where: { id },
    select: { id: true, clerkUserId: true },
  });

  if (!session || session.clerkUserId !== userId) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  await prisma.assessmentCentreSession.delete({ where: { id } });

  return NextResponse.json({ success: true, deletedId: id });
}
