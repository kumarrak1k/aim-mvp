import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { checkRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

const MAX_NAME_LEN = 200;
const MAX_ROLE_LEN = 200;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const rl = await checkRateLimit(userId, "certificate", 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

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
  if (name.trim().length > MAX_NAME_LEN || role.trim().length > MAX_ROLE_LEN) {
    return NextResponse.json({ error: "name and role must be under 200 characters" }, { status: 400 });
  }
  if (score < 1 || score > 10) {
    return NextResponse.json({ error: "score must be between 1 and 10" }, { status: 400 });
  }

  const cert = await prisma.certificate.create({
    data: { userId, name: name.trim(), role: role.trim(), score },
  });

  return NextResponse.json({ id: cert.id });
}
