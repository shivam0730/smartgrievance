import "server-only";
import { prisma } from "@/lib/db";
import type { ComplaintStatus } from "@/generated/prisma/client";

export const PAGE_SIZE = 10;
export const PENDING_STATUSES: ComplaintStatus[] = ["SUBMITTED", "AI_ANALYSIS", "ASSIGNED", "NEEDS_INFORMATION"];
export const CANCELLABLE_STATUSES: ComplaintStatus[] = ["SUBMITTED", "AI_ANALYSIS", "ASSIGNED"];

export async function getCitizenStats(userId: string) {
  const grouped = await prisma.complaint.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });
  const sum = (statuses: ComplaintStatus[]) =>
    grouped.filter((g) => statuses.includes(g.status)).reduce((n, g) => n + g._count._all, 0);

  return {
    total: grouped.reduce((n, g) => n + g._count._all, 0),
    pending: sum(PENDING_STATUSES),
    inProgress: sum(["IN_PROGRESS"]),
    resolved: sum(["RESOLVED"]),
  };
}

export async function listCitizenComplaints(
  userId: string,
  opts: { status?: ComplaintStatus; q?: string; page: number; pageSize?: number },
) {
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const where = {
    userId, // citizens only ever see their own complaints
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q
      ? {
          OR: [
            { ticketNumber: { contains: opts.q, mode: "insensitive" as const } },
            { title: { contains: opts.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        category: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  return { items, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCitizenComplaint(userId: string, id: string) {
  return prisma.complaint.findFirst({
    where: { id, userId }, // ownership check: someone else's id returns null
    include: {
      department: { select: { name: true } },
      images: { orderBy: { createdAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      feedback: true,
      aiAnalysis: {
        // suspicionReasons are intentionally NOT sent to citizens
        select: {
          status: true,
          category: true,
          categoryConfidence: true,
          severity: true,
          priority: true,
          duplicateScore: true,
          suspicionScore: true,
          reasoning: true,
          recommendedDepartment: { select: { name: true } },
        },
      },
    },
  });
}

export async function getRecentNotifications(userId: string, take = 3) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
