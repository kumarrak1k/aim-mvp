import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export type CompanyRole = "admin" | "recruiter" | "viewer";

export async function getAuthenticatedCompanyMember() {
  const { userId } = await auth();
  if (!userId) return null;

  const member = await prisma.companyMember.findFirst({
    where: { clerkUserId: userId },
    include: { company: true },
  });

  return member;
}

export async function requireCompanyAdmin() {
  const member = await getAuthenticatedCompanyMember();
  if (!member || member.role !== "admin") return null;
  return member;
}

export function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function cleanStr(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim().slice(0, 500) || fallback;
}
