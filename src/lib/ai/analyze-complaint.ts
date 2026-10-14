import "server-only";
import { prisma } from "@/lib/db";
import type { Category, Prisma } from "@/generated/prisma/client";
import { CATEGORY_LABEL, PRIORITY_LABEL } from "@/lib/format";
import { runDuplicateAndSuspicionChecks } from "./checks";
import { classifyComplaint } from "./classification";
import { CATEGORY_TO_DEPARTMENT, decideCategory, finalCategory, pickLeastLoaded } from "./decision";
import { buildReasoning } from "./explain";
import { FLAG_THRESHOLD } from "./duplicate-scoring";
import { computePriority } from "./priority";
import { getAIProvider } from "./provider";
import { analyzeImages, loadImages } from "./vision";

export type AnalyzeResult = { status: "completed" | "failed" | "skipped"; reason?: string };

const PLACEHOLDER_ID = /^(seed_|invited_)/;
const OPEN_STATUSES = ["ASSIGNED", "IN_PROGRESS", "NEEDS_INFORMATION"] as const;

/** Prefer officers who have really signed in; otherwise fall back to everyone in the department. */
async function chooseOfficer(departmentId: string): Promise<string | null> {
  const officers = await prisma.user.findMany({
    where: { role: "OFFICER", status: "ACTIVE", departmentId },
    select: { id: true, clerkUserId: true },
  });
  const real = officers.filter((o) => !PLACEHOLDER_ID.test(o.clerkUserId));
  const pool = real.length > 0 ? real : officers;
  if (pool.length === 0) return null;

  const grouped = await prisma.complaint.groupBy({
    by: ["assignedOfficerId"],
    where: { assignedOfficerId: { in: pool.map((o) => o.id) }, status: { in: [...OPEN_STATUSES] } },
    _count: { _all: true },
  });
  const loads: Record<string, number> = {};
  for (const g of grouped) if (g.assignedOfficerId) loads[g.assignedOfficerId] = g._count._all;
  return pickLeastLoaded(pool, loads);
}

async function activeAdminIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  return admins.map((a) => a.id);
}

/**
 * Full AI pipeline for one complaint.
 *  - "initial": analyse, set category/priority, route to a department (and officer) and notify people.
 *  - "refresh": only recompute the stored AI analysis; routing and status are left alone.
 * AI problems never lose the complaint: it falls back to manual review (see handleFailure).
 */
export async function analyzeComplaint(
  complaintId: string,
  opts: { mode?: "initial" | "refresh" } = {},
): Promise<AnalyzeResult> {
  const mode = opts.mode ?? "initial";

  if (mode === "initial") {
    // Claim the complaint so two workers never analyse it twice
    const claimed = await prisma.complaint.updateMany({
      where: { id: complaintId, status: "SUBMITTED" },
      data: { status: "AI_ANALYSIS" },
    });
    if (claimed.count === 0) return { status: "skipped", reason: "Complaint is not waiting for analysis" };
    await prisma.complaintStatusHistory.create({
      data: { complaintId, oldStatus: "SUBMITTED", newStatus: "AI_ANALYSIS", remarks: "AI analysis started" },
    });
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { images: { where: { kind: "COMPLAINT" }, orderBy: { createdAt: "asc" } } },
  });
  if (!complaint) return { status: "skipped", reason: "Complaint not found" };

  try {
    const provider = getAIProvider();
    const input = { title: complaint.title, description: complaint.description };
    const imageInputs = await loadImages(complaint.images);

    let visionFailed = false;
    const [text, vision] = await Promise.all([
      classifyComplaint(provider, input),
      imageInputs.length > 0
        ? analyzeImages(provider, imageInputs, input).catch((e) => {
            console.warn("[ai] photo analysis failed, continuing with text only:", e instanceof Error ? e.message : e);
            visionFailed = true;
            return null;
          })
        : Promise.resolve(null),
    ]);

    const decision = decideCategory(text, vision);
    const category = finalCategory(complaint.category, decision);

    // Image fingerprints: exact hash only (perceptual hash not enabled)
    const fingerprints = complaint.images.map((img) => ({
      sha: img.imageHash,
      ph: null as string | null,
    }));

    const checks = await runDuplicateAndSuspicionChecks({
      provider,
      complaint,
      category,
      fingerprints,
      isGenuineReport: text.isGenuineReport,
      textImageMismatch: decision.textImageMismatch,
      mismatchReasons: decision.mismatchReasons,
    });

    const priority = computePriority({
      textSeverity: text.severity,
      visionSeverity: vision?.severity ?? null,
      hazard: text.hazard || (vision?.hazard ?? false),
      description: `${complaint.title} ${complaint.description}`,
      similarNearby: checks.similarNearby,
    });
    const departmentName = CATEGORY_TO_DEPARTMENT[category];
    const department = departmentName
      ? await prisma.department.findFirst({ where: { name: departmentName, status: "ACTIVE" } })
      : null;

    const reasoning = buildReasoning({
      category,
      confidence: decision.confidence,
      priority: priority.priority,
      priorityReasons: priority.reasons,
      modelNote: text.reasoning,
      photoObservations: vision?.observations ?? [],
      departmentName: department?.name ?? null,
    });

    // Officer-only details (never shown to citizens)
    const signals = {
      classification: text,
      vision,
      visionFailed,
      textImageMismatch: decision.textImageMismatch,
      mismatchReasons: decision.mismatchReasons,
      priorityReasons: priority.reasons,
      citizenCategory: complaint.category,
      appliedCategory: category,
      duplicateCandidates: checks.candidates,
      reusedImages: checks.reusedImages,
      checkFailures: checks.failures,
    } as unknown as Prisma.InputJsonObject;

    // A human's earlier review decision is never overwritten by a re-run
    const existing = await prisma.aIAnalysis.findUnique({ where: { complaintId }, select: { reviewStatus: true } });
    const keepHumanDecision = existing?.reviewStatus === "CLEARED" || existing?.reviewStatus === "CONFIRMED";

    const analysisData = {
      status: "COMPLETED" as const,
      category: decision.category,
      categoryConfidence: decision.confidence,
      severity: priority.severity,
      priority: priority.priority,
      recommendedDepartmentId: department?.id ?? null,
      reasoning,
      signals,
      duplicateScore: checks.duplicateScore,
      suspicionScore: checks.suspicionScore,
      suspicionReasons: checks.suspicionReasons as unknown as Prisma.InputJsonArray,
      ...(keepHumanDecision ? {} : { reviewStatus: checks.suspicionScore > 60 ? ("PENDING" as const) : ("NOT_REQUIRED" as const) }),
      model: `${provider.name}:${provider.model}`,
      errorMessage: null,
    };



    if (mode === "refresh") {
      await prisma.aIAnalysis.upsert({
        where: { complaintId },
        create: { complaintId, ...analysisData },
        update: analysisData,
      });
      return { status: "completed" };
    }

    const officerId = department ? await chooseOfficer(department.id) : null;
    const adminIds = await activeAdminIds();

    const notes: Prisma.NotificationCreateManyInput[] = [
      {
        userId: complaint.userId,
        complaintId,
        type: "AI_ANALYSIS_COMPLETED",
        title: "AI analysis completed",
        message: `Detected category: ${CATEGORY_LABEL[category]}. Priority: ${PRIORITY_LABEL[priority.priority]}.`,
      },
    ];
    if (department) {
      notes.push({
        userId: complaint.userId,
        complaintId,
        type: "DEPARTMENT_ASSIGNED",
        title: "Department assigned",
        message: `Your complaint was routed to the ${department.name}.`,
      });
    }
    if (officerId) {
      notes.push({
        userId: officerId,
        complaintId,
        type: "OFFICER_ASSIGNED",
        title: "New complaint assigned",
        message: `${complaint.ticketNumber}: ${complaint.title}`,
      });
    }
    const reviewers = [...new Set([...(officerId ? [officerId] : []), ...adminIds])];
    const topDuplicate = checks.candidates[0];
    if (topDuplicate && checks.duplicateScore >= FLAG_THRESHOLD) {
      for (const userId of reviewers) {
        notes.push({
          userId,
          complaintId,
          type: "DUPLICATE_ALERT",
          title: "Possible duplicate complaint",
          message: `${complaint.ticketNumber} looks similar to ${topDuplicate.ticketNumber} (${Math.round(checks.duplicateScore * 100)}% match).`,
        });
      }
    }
    if (checks.suspicionScore > 60) {
      for (const userId of reviewers) {
        notes.push({
          userId,
          complaintId,
          type: "SUSPICIOUS_COMPLAINT",
          title: "Complaint needs review",
          message: `${complaint.ticketNumber} was flagged for human review (risk score ${checks.suspicionScore}/100).`,
        });
      }
    }
    if (priority.priority === "CRITICAL") {
      for (const userId of new Set([...(officerId ? [officerId] : []), ...adminIds])) {
        notes.push({
          userId,
          complaintId,
          type: "CRITICAL_COMPLAINT",
          title: "Critical complaint",
          message: `${complaint.ticketNumber}: ${complaint.title}`,
        });
      }
    }
    if (!department) {
      for (const userId of adminIds) {
        notes.push({
          userId,
          complaintId,
          type: "SYSTEM",
          title: "Complaint needs manual routing",
          message: `${complaint.ticketNumber} could not be routed automatically.`,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.aIAnalysis.upsert({
        where: { complaintId },
        create: { complaintId, ...analysisData },
        update: analysisData,
      });
      await tx.complaint.update({
        where: { id: complaintId },
        data: {
          category,
          priority: priority.priority,
          departmentId: department?.id ?? null,
          assignedOfficerId: officerId,
          status: department ? "ASSIGNED" : "AI_ANALYSIS",
        },
      });
      if (department) {
        await tx.complaintStatusHistory.create({
          data: {
            complaintId,
            oldStatus: "AI_ANALYSIS",
            newStatus: "ASSIGNED",
            remarks: `Routed to ${department.name} based on AI recommendation`,
          },
        });
      }
      await tx.notification.createMany({ data: notes });
      await tx.auditLog.create({
        data: {
          actorId: null,
          action: "AI_ANALYSIS_COMPLETED",
          entityType: "Complaint",
          entityId: complaintId,
          oldValue: { category: complaint.category, priority: complaint.priority },
          newValue: {
            category,
            priority: priority.priority,
            departmentId: department?.id ?? null,
            model: analysisData.model,
          },
        },
      });
    });
    return { status: "completed" };
  } catch (e) {
    console.error("[ai] analysis failed:", e);
    const message = (e instanceof Error ? e.message : "Unknown error").slice(0, 500);
    await handleFailure(complaint.id, complaint.category, mode, message);
    return { status: "failed", reason: message };
  }
}

/** AI is down or returned rubbish: keep the complaint safe and send it to manual review. */
async function handleFailure(complaintId: string, citizenCategory: Category, mode: "initial" | "refresh", message: string) {
  try {
    await prisma.aIAnalysis.upsert({
      where: { complaintId },
      create: { complaintId, status: "FAILED", errorMessage: message },
      update: { status: "FAILED", errorMessage: message },
    });
    if (mode === "refresh") return;

    const deptName = CATEGORY_TO_DEPARTMENT[citizenCategory];
    const department = deptName
      ? await prisma.department.findFirst({ where: { name: deptName, status: "ACTIVE" } })
      : null;
    const officerId = department ? await chooseOfficer(department.id) : null;

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: department ? "ASSIGNED" : "SUBMITTED",
        departmentId: department?.id ?? null,
        assignedOfficerId: officerId,
      },
    });
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId,
        oldStatus: "AI_ANALYSIS",
        newStatus: department ? "ASSIGNED" : "SUBMITTED",
        remarks: department
          ? `AI unavailable. Routed to ${department.name} using the selected category`
          : "AI analysis unavailable. Needs manual review",
      },
    });
    const adminIds = await activeAdminIds();
    if (adminIds.length > 0) {
      await prisma.notification.createMany({
        data: adminIds.map((userId) => ({
          userId,
          complaintId,
          type: "AI_ANOMALY" as const,
          title: "AI analysis failed",
          message: "A complaint was saved but AI analysis failed. Please review it manually.",
        })),
      });
    }
  } catch (e) {
    console.error("[ai] could not record the failure:", e);
  }
}