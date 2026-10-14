import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { CANCELLABLE_STATUSES } from "@/lib/data/complaints";
import { complaintActionSchema } from "@/lib/validations/complaint";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await authorizeApi(["CITIZEN"]);
  if ("error" in a) return a.error;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = complaintActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // ownership check
  const complaint = await prisma.complaint.findFirst({
    where: { id, userId: a.user.id },
    select: { status: true },
  });
  if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });

  const cancelled = await prisma.$transaction(async (tx) => {
    // status check and update in one statement, so a status change in between cannot slip through
    const res = await tx.complaint.updateMany({
      where: { id, userId: a.user.id, status: { in: CANCELLABLE_STATUSES } },
      data: { status: "CANCELLED" },
    });
    if (res.count === 0) return false;

    await tx.complaintStatusHistory.create({
      data: {
        complaintId: id,
        oldStatus: complaint.status,
        newStatus: "CANCELLED",
        changedById: a.user.id,
        remarks: parsed.data.remarks ?? "Cancelled by citizen",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: a.user.id,
        action: "COMPLAINT_CANCELLED",
        entityType: "Complaint",
        entityId: id,
        oldValue: { status: complaint.status },
        newValue: { status: "CANCELLED" },
      },
    });
    return true;
  });

  if (!cancelled) {
    return NextResponse.json({ error: "This complaint can no longer be cancelled" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
