import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";

export async function PATCH() {
  const a = await authorizeApi();
  if ("error" in a) return a.error;

  const res = await prisma.notification.updateMany({
    where: { userId: a.user.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true, updated: res.count });
}
