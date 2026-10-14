import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

// Placeholder clerkUserId prefixes used for seeded / admin-invited users.
// A real Clerk account may only "claim" a row that still has one of these.
const CLAIMABLE_PREFIX = /^(seed_|invited_)/;

export function homeForRole(role: Role) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "OFFICER") return "/officer/dashboard";
  return "/citizen/dashboard";
}

/**
 * Returns the database user for the logged-in Clerk user.
 * - existing user          -> returned
 * - seeded/invited by email -> linked to this Clerk account (verified emails only)
 * - brand new               -> created as CITIZEN
 * Returns null when nobody is logged in.
 */
export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (existing) return existing;

  const cu = await currentUser();
  if (!cu) return null;

  const primary = cu.primaryEmailAddress ?? cu.emailAddresses[0];
  if (!primary || primary.verification?.status !== "verified") return null;
  const email = primary.emailAddress;
  const name = [cu.firstName, cu.lastName].filter(Boolean).join(" ") || email.split("@")[0];

  const byEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (byEmail) {
    if (!CLAIMABLE_PREFIX.test(byEmail.clerkUserId)) return null; // belongs to another Clerk account
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        clerkUserId: userId,
        imageUrl: cu.imageUrl,
        status: byEmail.status === "INVITED" ? "ACTIVE" : byEmail.status,
      },
    });
  }

  try {
    return await prisma.user.create({
      data: { clerkUserId: userId, name, email, imageUrl: cu.imageUrl, role: "CITIZEN" },
    });
  } catch (e) {
    // two requests raced to create the same user
    if ((e as { code?: string }).code === "P2002") {
      return prisma.user.findUnique({ where: { clerkUserId: userId } });
    }
    throw e;
  }
});

/** For pages and layouts: must be logged in and active. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/unauthorized?reason=no-account");
  if (user.status !== "ACTIVE") redirect("/unauthorized?reason=inactive");
  return user;
}

/** For pages and layouts: must have one of the allowed roles. */
export async function requireRole(allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/unauthorized");
  return user;
}

/**
 * For API route handlers:
 *   const a = await authorizeApi(["ADMIN"]);
 *   if ("error" in a) return a.error;
 *   const user = a.user;
 */
export async function authorizeApi(allowed?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  if (user.status !== "ACTIVE" || (allowed && !allowed.includes(user.role))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { user } as const;
}


/** For officer pages: require OFFICER role and ensure they have a department. */
export async function requireOfficer() {
  const user = await requireRole(["OFFICER"]);
  if (!user.departmentId) {
    // Officer without a department can't see anything meaningful yet.
    redirect("/unauthorized?reason=no-department");
  }
  return user;
}