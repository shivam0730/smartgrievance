import { randomInt } from "node:crypto";
import { after, NextResponse } from "next/server";
import { analyzeComplaint } from "@/lib/ai/analyze-complaint";
import { authorizeApi } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { verifyUpload } from "@/lib/uploads";
import { createComplaintSchema } from "@/lib/validations/complaint";

export const maxDuration = 60; // AI analysis continues after the response is sent

const TICKET_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no look-alike characters

function generateTicketNumber() {
  let code = "";
  for (let i = 0; i < 6; i++) code += TICKET_CHARS[randomInt(TICKET_CHARS.length)];
  return `SG-${new Date().getFullYear()}-${code}`;
}

export async function POST(req: Request) {
  const a = await authorizeApi(["CITIZEN"]);
  if ("error" in a) return a.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createComplaintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const images = d.images ?? [];

  // Every image must have been accepted by OUR upload endpoint for THIS user
  if (!images.every((img) => verifyUpload(a.user.id, img))) {
    return NextResponse.json({ error: "One of the uploaded photos is invalid. Please upload it again." }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const complaint = await prisma.complaint.create({
        data: {
          ticketNumber: generateTicketNumber(),
          userId: a.user.id,
          title: d.title,
          description: d.description,
          category: d.category ?? "OTHER", // AI will refine this in the AI step
          address: d.address,
          latitude: d.latitude,
          longitude: d.longitude,
          images: {
            create: images.map(({ proof: _proof, ...img }) => img),
          },
          statusHistory: {
            create: { newStatus: "SUBMITTED", changedById: a.user.id, remarks: "Complaint submitted" },
          },
          notifications: {
            create: {
              userId: a.user.id,
              type: "COMPLAINT_SUBMITTED",
              title: "Complaint submitted",
              message: `Your complaint "${d.title}" has been received.`,
            },
          },
        },
        select: { id: true, ticketNumber: true },
      });
      // Analyse in the background: the citizen gets their complaint ID immediately
      after(async () => {
        try {
          await analyzeComplaint(complaint.id);
        } catch (e) {
          console.error("[ai] background analysis crashed:", e);
        }
      });
      return NextResponse.json(complaint, { status: 201 });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") continue; // ticket number collision, retry
      throw e;
    }
  }
  return NextResponse.json({ error: "Could not create complaint. Please try again." }, { status: 500 });
}
