import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { feedbackSchema } from "@/lib/validations/feedback";

export async function POST(req: Request) {
  const a = await authorizeApi(["CITIZEN"]);
  if ("error" in a) return a.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid feedback" }, { status: 400 });
  }
  const d = parsed.data;

  // Only the owner of the complaint can review it, and only once it is resolved
  const complaint = await prisma.complaint.findFirst({
    where: { id: d.complaintId, userId: a.user.id },
    select: { status: true },
  });
  if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  if (complaint.status !== "RESOLVED") {
    return NextResponse.json({ error: "Feedback can be given only after the complaint is resolved" }, { status: 409 });
  }

  try {
    await prisma.feedback.create({
      data: {
        complaintId: d.complaintId,
        userId: a.user.id,
        rating: d.rating,
        outcome: d.outcome,
        comment: d.comment || null,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "You have already submitted feedback for this complaint" }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
