import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let body: { name: string; role: string; score: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, role, score } = body;
  if (!name?.trim() || !role?.trim() || typeof score !== "number") {
    return NextResponse.json({ error: "name, role, and score are required" }, { status: 400 });
  }
  if (score < 1 || score > 10) {
    return NextResponse.json({ error: "score must be between 1 and 10" }, { status: 400 });
  }

  const cert = await prisma.certificate.create({
    data: { userId, name: name.trim(), role: role.trim(), score },
  });

  return NextResponse.json({ id: cert.id });
}
