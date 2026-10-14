"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOfficer } from "@/lib/auth/current-user";
import {
  canTransition,
  officerStatusUpdateSchema,
  overrideAnalysisSchema,
  requestInfoSchema,
  resolveComplaintSchema,
  rejectComplaintSchema,
} from "@/lib/validations/officer";
import { NotificationType, ImageKind } from "@/generated/prisma/client";

export type ActionResult = { ok: true } | { ok: false; error: string };

// ─────────────────────────────────────────────
// Shared helper: fetch + access check
// ─────────────────────────────────────────────
type LoadedComplaint =
  | { ok: true; complaint: NonNullable<Awaited<ReturnType<typeof fetchComplaint>>> }
  | { ok: false; error: string };

async function fetchComplaint(id: string) {
  return prisma.complaint.findUnique({
    where: { id },
    include: { aiAnalysis: true },
  });
}

async function loadComplaintForOfficer(
  complaintId: string,
  officerId: string,
  departmentId: string | null,
): Promise<LoadedComplaint> {
  const complaint = await fetchComplaint(complaintId);
  if (!complaint) return { ok: false, error: "Complaint not found" };

  const canAct =
    complaint.assignedOfficerId === officerId ||
    (!!departmentId && complaint.departmentId === departmentId);

  if (!canAct) return { ok: false, error: "You cannot act on this complaint" };
  return { ok: true, complaint };
}

// ─────────────────────────────────────────────
// Notification helper
// ─────────────────────────────────────────────
async function notifyCitizen(
  userId: string,
  complaintId: string,
  type: NotificationType,
  title: string,
  message: string,
) {
  await prisma.notification.create({
    data: { userId, complaintId, type, title, message },
  });
}

// ─────────────────────────────────────────────
// 1) Update status
// ─────────────────────────────────────────────
export async function updateStatusAction(
  complaintId: string,
  input: unknown,
): Promise<ActionResult> {
  const officer = await requireOfficer();
  const parsed = officerStatusUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const { newStatus, remarks } = parsed.data;
  const loaded = await loadComplaintForOfficer(
    complaintId,
    officer.id,
    officer.departmentId,
  );
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { complaint } = loaded;

  if (!canTransition(complaint.status, newStatus)) {
    return {
      ok: false,
      error: `Cannot move from ${complaint.status} to ${newStatus}`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: newStatus,
        assignedOfficerId: complaint.assignedOfficerId ?? officer.id,
        resolvedAt: newStatus === "RESOLVED" ? new Date() : undefined,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus,
        changedById: officer.id,
        remarks: remarks ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action: "STATUS_UPDATED",
        entityType: "Complaint",
        entityId: complaintId,
        oldValue: { status: complaint.status },
        newValue: { status: newStatus, remarks: remarks ?? null },
      },
    });
  });

  await notifyCitizen(
    complaint.userId,
    complaintId,
    NotificationType.STATUS_CHANGED,
    "Complaint status updated",
    `Your complaint is now "${newStatus}".`,
  );

  revalidatePath(`/officer/complaints/${complaintId}`);
  revalidatePath("/officer/complaints");
  revalidatePath("/officer/dashboard");
  revalidatePath(`/citizen/complaints/${complaintId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 2) Override AI analysis
// ─────────────────────────────────────────────
export async function overrideAnalysisAction(
  complaintId: string,
  input: unknown,
): Promise<ActionResult> {
  const officer = await requireOfficer();
  const parsed = overrideAnalysisSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const loaded = await loadComplaintForOfficer(
    complaintId,
    officer.id,
    officer.departmentId,
  );
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { complaint } = loaded;

  const { category, priority, departmentId, reason } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        category: category ?? undefined,
        priority: priority ?? undefined,
        departmentId: departmentId ?? undefined,
      },
    });

    // Mark analysis as reviewed by this officer; the full override trail
    // lives in AuditLog below.
    if (complaint.aiAnalysis) {
      await tx.aIAnalysis.update({
        where: { id: complaint.aiAnalysis.id },
        data: {
          reviewedById: officer.id,
          reviewedAt: new Date(),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action: "AI_OVERRIDE",
        entityType: "Complaint",
        entityId: complaintId,
        oldValue: {
          category: complaint.category,
          priority: complaint.priority,
          departmentId: complaint.departmentId,
        },
        newValue: { category, priority, departmentId, reason },
      },
    });
  });

  revalidatePath(`/officer/complaints/${complaintId}`);
  revalidatePath("/officer/complaints");
  return { ok: true };
}

// ─────────────────────────────────────────────
// 3) Request more info
// ─────────────────────────────────────────────
export async function requestInfoAction(
  complaintId: string,
  input: unknown,
): Promise<ActionResult> {
  const officer = await requireOfficer();
  const parsed = requestInfoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const loaded = await loadComplaintForOfficer(
    complaintId,
    officer.id,
    officer.departmentId,
  );
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { complaint } = loaded;

  if (!canTransition(complaint.status, "NEEDS_INFORMATION")) {
    return { ok: false, error: "Cannot request info at this stage" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "NEEDS_INFORMATION",
        assignedOfficerId: complaint.assignedOfficerId ?? officer.id,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: "NEEDS_INFORMATION",
        changedById: officer.id,
        remarks: parsed.data.message,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action: "INFO_REQUESTED",
        entityType: "Complaint",
        entityId: complaintId,
        newValue: { message: parsed.data.message },
      },
    });
  });

  await notifyCitizen(
    complaint.userId,
    complaintId,
    NotificationType.INFO_REQUESTED,
    "Additional information requested",
    parsed.data.message,
  );

  revalidatePath(`/officer/complaints/${complaintId}`);
  revalidatePath(`/citizen/complaints/${complaintId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 4) Resolve with evidence
// ─────────────────────────────────────────────
export async function resolveComplaintAction(
  complaintId: string,
  input: unknown,
): Promise<ActionResult> {
  const officer = await requireOfficer();
  const parsed = resolveComplaintSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const loaded = await loadComplaintForOfficer(
    complaintId,
    officer.id,
    officer.departmentId,
  );
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { complaint } = loaded;

  if (!canTransition(complaint.status, "RESOLVED")) {
    return { ok: false, error: "Cannot resolve from current status" };
  }

  const { remarks, evidenceUrls } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        assignedOfficerId: complaint.assignedOfficerId ?? officer.id,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: "RESOLVED",
        changedById: officer.id,
        remarks,
      },
    });

    if (evidenceUrls.length > 0) {
      await tx.complaintImage.createMany({
        data: evidenceUrls.map((e) => ({
          complaintId,
          kind: ImageKind.RESOLUTION,
          imageUrl: e.imageUrl,
          storageKey: e.storageKey,
          fileName: e.fileName,
          mimeType: e.mimeType,
          sizeBytes: e.sizeBytes ?? null,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action: "RESOLVED",
        entityType: "Complaint",
        entityId: complaintId,
        newValue: { remarks, evidenceCount: evidenceUrls.length },
      },
    });
  });

  await notifyCitizen(
    complaint.userId,
    complaintId,
    NotificationType.COMPLAINT_RESOLVED,
    "Complaint resolved",
    "Your complaint has been marked resolved. Please share feedback.",
  );

  revalidatePath(`/officer/complaints/${complaintId}`);
  revalidatePath("/officer/complaints");
  revalidatePath("/officer/dashboard");
  revalidatePath(`/citizen/complaints/${complaintId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 5) Reject with reason
// ─────────────────────────────────────────────
export async function rejectComplaintAction(
  complaintId: string,
  input: unknown,
): Promise<ActionResult> {
  const officer = await requireOfficer();
  const parsed = rejectComplaintSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const loaded = await loadComplaintForOfficer(
    complaintId,
    officer.id,
    officer.departmentId,
  );
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { complaint } = loaded;

  if (!canTransition(complaint.status, "REJECTED")) {
    return { ok: false, error: "Cannot reject from current status" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "REJECTED",
        assignedOfficerId: complaint.assignedOfficerId ?? officer.id,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: "REJECTED",
        changedById: officer.id,
        remarks: parsed.data.reason,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action: "REJECTED",
        entityType: "Complaint",
        entityId: complaintId,
        newValue: { reason: parsed.data.reason },
      },
    });
  });

  await notifyCitizen(
    complaint.userId,
    complaintId,
    NotificationType.STATUS_CHANGED,
    "Complaint rejected",
    parsed.data.reason,
  );

  revalidatePath(`/officer/complaints/${complaintId}`);
  revalidatePath("/officer/complaints");
  revalidatePath(`/citizen/complaints/${complaintId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 6) Mark as duplicate
// ─────────────────────────────────────────────
export async function markDuplicateAction(
  complaintId: string,
  primaryComplaintId: string,
  remarks?: string,
): Promise<ActionResult> {
  const officer = await requireOfficer();

  const loaded = await loadComplaintForOfficer(
    complaintId,
    officer.id,
    officer.departmentId,
  );
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { complaint } = loaded;

  if (!canTransition(complaint.status, "DUPLICATE")) {
    return { ok: false, error: "Cannot mark duplicate from current status" };
  }

  if (primaryComplaintId === complaintId) {
    return { ok: false, error: "Cannot duplicate against itself" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: "DUPLICATE",
        duplicateOfId: primaryComplaintId,
        assignedOfficerId: complaint.assignedOfficerId ?? officer.id,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: "DUPLICATE",
        changedById: officer.id,
        remarks: remarks ?? `Marked duplicate of ${primaryComplaintId}`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action: "MARKED_DUPLICATE",
        entityType: "Complaint",
        entityId: complaintId,
        newValue: { duplicateOfId: primaryComplaintId, remarks: remarks ?? null },
      },
    });
  });

  await notifyCitizen(
    complaint.userId,
    complaintId,
    NotificationType.STATUS_CHANGED,
    "Complaint marked as duplicate",
    "Your complaint was merged with a similar one.",
  );

  revalidatePath(`/officer/complaints/${complaintId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 7) Review suspicion (clear / confirm)
// ─────────────────────────────────────────────
export async function reviewSuspicionAction(
  complaintId: string,
  decision: "CLEARED" | "CONFIRMED",
  notes?: string,
): Promise<ActionResult> {
  const officer = await requireOfficer();

  const analysis = await prisma.aIAnalysis.findUnique({
    where: { complaintId },
    include: { complaint: true },
  });
  if (!analysis) return { ok: false, error: "No AI analysis found" };

  const canAct =
    analysis.complaint.assignedOfficerId === officer.id ||
    (!!officer.departmentId &&
      analysis.complaint.departmentId === officer.departmentId);
  if (!canAct) return { ok: false, error: "Not allowed" };

  await prisma.$transaction(async (tx) => {
    await tx.aIAnalysis.update({
      where: { complaintId },
      data: {
        reviewStatus: decision,
        reviewedById: officer.id,
        reviewedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action:
          decision === "CLEARED" ? "SUSPICION_CLEARED" : "SUSPICION_CONFIRMED",
        entityType: "AIAnalysis",
        entityId: analysis.id,
        newValue: { decision, notes: notes ?? null },
      },
    });
  });

  revalidatePath(`/officer/suspicious`);
  revalidatePath(`/officer/suspicious/${complaintId}`);
  revalidatePath(`/officer/complaints/${complaintId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 8) Merge / separate a duplicate pair
// ─────────────────────────────────────────────
export async function resolveDuplicatePairAction(
  similarityId: string,
  decision: "MERGE" | "KEEP_SEPARATE",
  primaryComplaintId: string | null,
  notes?: string,
): Promise<ActionResult> {
  const officer = await requireOfficer();

  const pair = await prisma.complaintSimilarity.findUnique({
    where: { id: similarityId },
    include: {
      complaintA: true,
      complaintB: true,
    },
  });
  if (!pair) return { ok: false, error: "Pair not found" };

  const a = pair.complaintA;
  const b = pair.complaintB;

  const canAct =
    a.assignedOfficerId === officer.id ||
    b.assignedOfficerId === officer.id ||
    (!!officer.departmentId &&
      (a.departmentId === officer.departmentId ||
        b.departmentId === officer.departmentId));
  if (!canAct) return { ok: false, error: "Not allowed" };

  if (decision === "KEEP_SEPARATE") {
    await prisma.$transaction(async (tx) => {
      await tx.complaintSimilarity.update({
        where: { id: similarityId },
        data: { isConfirmedDuplicate: false },
      });
      await tx.auditLog.create({
        data: {
          actorId: officer.id,
          action: "DUPLICATE_KEPT_SEPARATE",
          entityType: "ComplaintSimilarity",
          entityId: similarityId,
          newValue: { notes: notes ?? null },
        },
      });
    });
    revalidatePath("/officer/duplicates");
    revalidatePath(`/officer/duplicates/${similarityId}`);
    return { ok: true };
  }

  // MERGE — the duplicate complaint becomes duplicateOf the primary
  const duplicateId =
    primaryComplaintId === a.id ? b.id : primaryComplaintId === b.id ? a.id : null;
  const primaryId =
    primaryComplaintId ?? (a.status !== "DUPLICATE" ? a.id : b.id);

  if (!primaryId || !duplicateId) {
    return { ok: false, error: "Invalid primary complaint" };
  }
  if (primaryId === duplicateId) {
    return { ok: false, error: "Cannot merge a complaint with itself" };
  }

  const duplicate = primaryId === a.id ? b : a;

  if (!canTransition(duplicate.status, "DUPLICATE")) {
    return {
      ok: false,
      error: `Cannot mark as duplicate from status ${duplicate.status}`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id: duplicateId },
      data: {
        status: "DUPLICATE",
        duplicateOfId: primaryId,
        assignedOfficerId: duplicate.assignedOfficerId ?? officer.id,
      },
    });

    await tx.complaintStatusHistory.create({
      data: {
        complaintId: duplicateId,
        oldStatus: duplicate.status,
        newStatus: "DUPLICATE",
        changedById: officer.id,
        remarks: notes ?? `Marked duplicate of ${primaryId}`,
      },
    });

    await tx.complaintSimilarity.update({
      where: { id: similarityId },
      data: { isConfirmedDuplicate: true },
    });

    await tx.auditLog.create({
      data: {
        actorId: officer.id,
        action: "DUPLICATE_MERGED",
        entityType: "ComplaintSimilarity",
        entityId: similarityId,
        newValue: {
          primaryComplaintId: primaryId,
          duplicateComplaintId: duplicateId,
          notes: notes ?? null,
        },
      },
    });
  });

  await notifyCitizen(
    duplicate.userId,
    duplicateId,
    NotificationType.STATUS_CHANGED,
    "Complaint merged",
    "Your complaint was merged with a similar one. You can track the primary complaint for updates.",
  );

  revalidatePath("/officer/duplicates");
  revalidatePath(`/officer/duplicates/${similarityId}`);
  revalidatePath(`/officer/complaints/${duplicateId}`);
  revalidatePath(`/officer/complaints/${primaryId}`);
  revalidatePath(`/citizen/complaints/${duplicateId}`);
  return { ok: true };
}

// ─────────────────────────────────────────────
// 9) Notification read actions
// ─────────────────────────────────────────────
export async function markOfficerNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  const officer = await requireOfficer();

  const notif = await prisma.notification.findFirst({
    where: { id: notificationId, userId: officer.id },
  });
  if (!notif) return { ok: false, error: "Notification not found" };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/officer/notifications");
  return { ok: true };
}

export async function markAllOfficerNotificationsReadAction(): Promise<ActionResult> {
  const officer = await requireOfficer();

  await prisma.notification.updateMany({
    where: { userId: officer.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/officer/notifications");
  revalidatePath("/officer/dashboard");
  return { ok: true };
}