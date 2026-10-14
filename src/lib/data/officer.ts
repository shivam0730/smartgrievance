import "server-only";
import { prisma } from "@/lib/db";
import type { OfficerListQuery, SuspiciousListQuery, DuplicatesListQuery } from "@/lib/validations/officer";

import type {
  Category,
  ComplaintStatus,
  Priority,
} from "@/generated/prisma/client";

const LIST_SELECT = {
  id: true,
  ticketNumber: true,
  title: true,
  category: true,
  status: true,
  priority: true,
  address: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  user: { select: { id: true, name: true, email: true, imageUrl: true } },
  department: { select: { id: true, name: true } },
  assignedOfficer: { select: { id: true, name: true } },
  aiAnalysis: {
    select: {
      category: true,
      categoryConfidence: true,
      severity: true,
      priority: true,
      duplicateScore: true,
      suspicionScore: true,
      reviewStatus: true,
    },
  },
  _count: { select: { images: true } },
} as const;

/**
 * Officer complaint list.
 * scope="assigned"   -> only complaints assigned to this officer
 * scope="department" -> all complaints in officer's department
 * scope="all"        -> all complaints (only if you want officers to see everything)
 */
export async function listOfficerComplaints(
  officerId: string,
  departmentId: string | null,
  query: OfficerListQuery,
) {
  const where: any = {};

  if (query.scope === "assigned") {
    where.assignedOfficerId = officerId;
  } else if (query.scope === "department") {
    if (!departmentId) return { items: [], total: 0, totalPages: 1 };
    where.departmentId = departmentId;
  }
  // scope === "all" -> no filter

  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;
  if (query.priority) where.priority = query.priority;

  if (query.q) {
    where.OR = [
      { ticketNumber: { contains: query.q, mode: "insensitive" } },
      { title: { contains: query.q, mode: "insensitive" } },
      { address: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      select: LIST_SELECT,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.complaint.count({ where }),
  ]);

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Full complaint detail for officer view — includes AI reasoning, similarities, history. */
export async function getOfficerComplaintById(id: string, officerId: string, departmentId: string | null) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, imageUrl: true, createdAt: true } },
      department: true,
      assignedOfficer: { select: { id: true, name: true, email: true } },
      duplicateOf: { select: { id: true, ticketNumber: true, title: true, status: true } },
      duplicates: { select: { id: true, ticketNumber: true, title: true, status: true } },
      images: { orderBy: { createdAt: "asc" } },
      aiAnalysis: {
        include: {
          recommendedDepartment: true,
          reviewedBy: { select: { id: true, name: true } },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true, role: true } } },
      },
      feedback: true,
      similarityAsA: {
        orderBy: { overallScore: "desc" },
        take: 5,
        include: {
          complaintB: {
            select: { id: true, ticketNumber: true, title: true, status: true, address: true },
          },
        },
      },
      similarityAsB: {
        orderBy: { overallScore: "desc" },
        take: 5,
        include: {
          complaintA: {
            select: { id: true, ticketNumber: true, title: true, status: true, address: true },
          },
        },
      },
    },
  });

  if (!complaint) return null;

  // Access control: officer can see it if assigned to them, or in their department, or unassigned
  const canAccess =
    complaint.assignedOfficerId === officerId ||
    (departmentId && complaint.departmentId === departmentId) ||
    complaint.assignedOfficerId === null;

  if (!canAccess) return null;
  return complaint;
}

/** Dashboard stats for an officer. */
export async function getOfficerDashboardStats(officerId: string, departmentId: string | null) {
  const scopeWhere = {
    OR: [
      { assignedOfficerId: officerId },
      ...(departmentId ? [{ departmentId, assignedOfficerId: null }] : []),
    ],
  };

  const [assigned, pending, inProgress, critical, resolved, needsInfo, suspiciousPending, duplicatesPending] =
    await Promise.all([
      prisma.complaint.count({ where: { assignedOfficerId: officerId } }),
      prisma.complaint.count({
        where: { ...scopeWhere, status: { in: ["SUBMITTED", "AI_ANALYSIS", "ASSIGNED"] } },
      }),
      prisma.complaint.count({
        where: { ...scopeWhere, status: "IN_PROGRESS" },
      }),
      prisma.complaint.count({
        where: { ...scopeWhere, priority: "CRITICAL", status: { notIn: ["RESOLVED", "REJECTED", "CANCELLED", "DUPLICATE"] } },
      }),
      prisma.complaint.count({
        where: { assignedOfficerId: officerId, status: "RESOLVED" },
      }),
      prisma.complaint.count({
        where: { ...scopeWhere, status: "NEEDS_INFORMATION" },
      }),
      prisma.aIAnalysis.count({
        where: {
          reviewStatus: "PENDING",
          complaint: scopeWhere,
        },
      }),
      prisma.complaintSimilarity.count({
        where: {
          isConfirmedDuplicate: null,
          overallScore: { gte: 0.6 },
          OR: [{ complaintA: scopeWhere }, { complaintB: scopeWhere }],
        },
      }),
    ]);

  return {
    assigned,
    pending,
    inProgress,
    critical,
    resolved,
    needsInfo,
    suspiciousPending,
    duplicatesPending,
  };
}

/** Recent assignments for dashboard. */
export async function getOfficerRecentAssignments(officerId: string, limit = 8) {
  return prisma.complaint.findMany({
    where: { assignedOfficerId: officerId },
    select: LIST_SELECT,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

/** Critical cases needing attention. */
export async function getOfficerCriticalCases(officerId: string, departmentId: string | null, limit = 6) {
  const where: any = {
    priority: "CRITICAL",
    status: { notIn: ["RESOLVED", "REJECTED", "CANCELLED", "DUPLICATE"] },
    OR: [
      { assignedOfficerId: officerId },
      ...(departmentId ? [{ departmentId, assignedOfficerId: null }] : []),
    ],
  };
  return prisma.complaint.findMany({
    where,
    select: LIST_SELECT,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** AI alerts: suspicious complaints pending human review. */
export async function getOfficerAIAlerts(officerId: string, departmentId: string | null, limit = 6) {
  return prisma.aIAnalysis.findMany({
    where: {
      reviewStatus: "PENDING",
      complaint: {
        OR: [
          { assignedOfficerId: officerId },
          ...(departmentId ? [{ departmentId, assignedOfficerId: null }] : []),
        ],
      },
    },
    include: {
      complaint: { select: LIST_SELECT },
    },
    orderBy: { suspicionScore: "desc" },
    take: limit,
  });
}

// ───────────────── Suspicious list ─────────────────

export async function listSuspiciousComplaints(
  officerId: string,
  departmentId: string | null,
  query: SuspiciousListQuery,
) {
  const where: any = {
    suspicionScore: { gte: query.minScore },
  };
  if (query.reviewStatus !== "ALL") {
    where.reviewStatus = query.reviewStatus;
  }

  const complaintScope = {
    OR: [
      { assignedOfficerId: officerId },
      ...(departmentId ? [{ departmentId }, { departmentId: null }] : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.aIAnalysis.findMany({
      where: { ...where, complaint: complaintScope },
      include: {
        complaint: { select: LIST_SELECT },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { suspicionScore: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.aIAnalysis.count({ where: { ...where, complaint: complaintScope } }),
  ]);

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

// ───────────────── Duplicates list ─────────────────

export async function listDuplicatePairs(
  officerId: string,
  departmentId: string | null,
  query: DuplicatesListQuery,
) {
  const where: any = {
    overallScore: { gte: query.minScore },
  };
  if (query.confirmed === "PENDING") where.isConfirmedDuplicate = null;
  else if (query.confirmed === "YES") where.isConfirmedDuplicate = true;
  else if (query.confirmed === "NO") where.isConfirmedDuplicate = false;

  const complaintScope = {
    OR: [
      { assignedOfficerId: officerId },
      ...(departmentId ? [{ departmentId }] : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.complaintSimilarity.findMany({
      where: {
        ...where,
        OR: [{ complaintA: complaintScope }, { complaintB: complaintScope }],
      },
      include: {
        complaintA: { select: LIST_SELECT },
        complaintB: { select: LIST_SELECT },
      },
      orderBy: { overallScore: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.complaintSimilarity.count({
      where: {
        ...where,
        OR: [{ complaintA: complaintScope }, { complaintB: complaintScope }],
      },
    }),
  ]);

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** Single similarity pair for the compare view. */
export async function getDuplicatePairById(id: string) {
  return prisma.complaintSimilarity.findUnique({
    where: { id },
    include: {
      complaintA: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          images: true,
          aiAnalysis: true,
        },
      },
      complaintB: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          images: true,
          aiAnalysis: true,
        },
      },
    },
  });
}

/** Officer's department info (for filters, sidebar). */
export async function getOfficerContext(officerId: string) {
  const officer = await prisma.user.findUnique({
    where: { id: officerId },
    select: {
      id: true,
      name: true,
      email: true,
      imageUrl: true,
      department: { select: { id: true, name: true, description: true } },
    },
  });
  return officer;
}

/** Unread notification count for officer header badge. */
export async function getOfficerUnreadNotificationCount(officerId: string) {
  return prisma.notification.count({
    where: { userId: officerId, isRead: false },
  });
}

// ─────────────────────────────────────────────
// Map data
// ─────────────────────────────────────────────
export async function listOfficerComplaintsForMap(
  officerId: string,
  departmentId: string | null,
  opts: {
    scope?: "assigned" | "department" | "all";
    category?: Category;
    priority?: Priority;
    status?: ComplaintStatus;
  } = {},
) {
  const scope = opts.scope ?? "assigned";
  const where: any = {};

  if (scope === "assigned") {
    where.assignedOfficerId = officerId;
  } else if (scope === "department") {
    if (!departmentId) return [];
    where.departmentId = departmentId;
  }

  if (opts.category) where.category = opts.category;
  if (opts.priority) where.priority = opts.priority;
  if (opts.status) where.status = opts.status;

  return prisma.complaint.findMany({
    where,
    select: {
      id: true,
      ticketNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      latitude: true,
      longitude: true,
      address: true,
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 500, // cap for map rendering
  });
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
export async function listOfficerNotifications(
  officerId: string,
  opts: { unreadOnly?: boolean; page?: number; pageSize?: number } = {},
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 30;
  const where = {
    userId: officerId,
    ...(opts.unreadOnly ? { isRead: false } : {}),
  };

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        complaint: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
          },
        },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: officerId, isRead: false } }),
  ]);

  return {
    items,
    total,
    unreadCount,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOfficerNotificationById(id: string, officerId: string) {
  return prisma.notification.findFirst({
    where: { id, userId: officerId },
    include: {
      complaint: {
        select: { id: true, ticketNumber: true, title: true, status: true },
      },
    },
  });
}
