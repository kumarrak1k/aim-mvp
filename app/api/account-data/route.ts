import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to export your data." },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const profile =
      (user.privateMetadata?.candidateProfile as Record<string, unknown>) ||
      null;

    const sessions = await prisma.practiceSession.findMany({
      where: { clerkUserId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        role: true,
        experienceLevel: true,
        interviewType: true,
        difficulty: true,
        focusArea: true,
        practiceMode: true,
        totalQuestions: true,
        overallScore: true,
        hireSignal: true,
        summary: true,
        results: true,
        speakerPreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      profile: profile ?? {},
      practiceSessions: sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ai-career-mentor-data-${new Date().toISOString().split("T")[0]}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ACCOUNT DATA EXPORT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to export account data." },
      { status: 500 }
    );
  }
}
