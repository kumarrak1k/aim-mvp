import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

export type ApiAuthResult =
  | { ok: true; companyId: string }
  | { ok: false; response: NextResponse };

export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing or malformed Authorization header. Use: Bearer <api_key>" },
        { status: 401 }
      ),
    };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("aim_")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid API key format." },
        { status: 401 }
      ),
    };
  }

  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { id: true, companyId: true, revokedAt: true },
  });

  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid API key." }, { status: 401 }),
    };
  }

  if (apiKey.revokedAt) {
    return {
      ok: false,
      response: NextResponse.json({ error: "API key has been revoked." }, { status: 401 }),
    };
  }

  // Fire-and-forget lastUsedAt update so it doesn't slow the response
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return { ok: true, companyId: apiKey.companyId };
}
