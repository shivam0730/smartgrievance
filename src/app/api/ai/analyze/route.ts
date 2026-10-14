import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeComplaint } from "@/lib/ai/analyze-complaint";
import { authorizeApi } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

const bodySchema = z.object({ complaintId: z.string().min(1), refresh: z.boolean().optional() });

/** Re-run (or run) AI analysis. Officers and admins only. */
export async function POST(req: Request) {
  const a = await authorizeApi(["ADMIN", "OFFICER"]);
  if ("error" in a) return a.error;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { complaintId, refresh } = parsed.data;

  const complaint = await prisma.complaint.findUnique({ where: { id: complaintId }, select: { departmentId: true } });
  if (!complaint) return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  if (a.user.role === "OFFICER" && complaint.departmentId !== a.user.departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await analyzeComplaint(complaintId, { mode: refresh ? "refresh" : "initial" });
  return NextResponse.json(result);
}
