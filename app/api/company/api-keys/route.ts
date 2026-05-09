import { createHash, randomBytes } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/company/api-keys — list keys for the caller's company
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const member = await prisma.companyMember.findFirst({
    where: { clerkUserId: userId, role: { in: ["admin", "recruiter"] } },
  });
  if (!member) return NextResponse.json({ error: "Not a company member." }, { status: 403 });

  const keys = await prisma.apiKey.findMany({
    where: { companyId: member.companyId, revokedAt: null },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

// POST /api/company/api-keys — create a new key (returns raw key once only)
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const member = await prisma.companyMember.findFirst({
    where: { clerkUserId: userId, role: "admin" },
  });
  if (!member) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Key name is required." }, { status: 400 });

  const rawKey = "aim_" + randomBytes(20).toString("hex"); // aim_ + 40 hex = 44 chars
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12); // "aim_" + first 8 hex chars

  const apiKey = await prisma.apiKey.create({
    data: {
      companyId: member.companyId,
      name,
      keyHash,
      keyPrefix,
    },
    select: { id: true, name: true, keyPrefix: true, createdAt: true },
  });

  // rawKey is returned ONCE — never stored, never retrievable again
  return NextResponse.json({ ...apiKey, key: rawKey }, { status: 201 });
}

// DELETE /api/company/api-keys?id=<keyId> — revoke a key
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const member = await prisma.companyMember.findFirst({
    where: { clerkUserId: userId, role: "admin" },
  });
  if (!member) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const key = await prisma.apiKey.findFirst({
    where: { id, companyId: member.companyId, revokedAt: null },
  });
  if (!key) return NextResponse.json({ error: "Key not found." }, { status: 404 });

  await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
