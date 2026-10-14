import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorizeApi(); // any signed-in, active user (citizen, officer, admin)
  if ("error" in a) return a.error;
  const { id } = await params;

  const res = await prisma.notification.updateMany({
    where: { id, userId: a.user.id }, // cannot touch someone else's notification
    data: { isRead: true },
  });
  if (res.count === 0) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
