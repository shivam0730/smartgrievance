import { z } from "zod";
import { Category, ComplaintStatus, Priority } from "@/generated/prisma/client";

// ── Query params for officer complaint list ──
export const officerListQuerySchema = z.object({
  status: z.nativeEnum(ComplaintStatus).optional(),
  category: z.nativeEnum(Category).optional(),
  priority: z.nativeEnum(Priority).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  scope: z.enum(["assigned", "department", "all"]).default("assigned"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type OfficerListQuery = z.infer<typeof officerListQuerySchema>;

// ── Query params for suspicious list ──
export const suspiciousListQuerySchema = z.object({
  minScore: z.coerce.number().int().min(0).max(100).default(40),
  reviewStatus: z.enum(["PENDING", "CLEARED", "CONFIRMED", "ALL"]).default("PENDING"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SuspiciousListQuery = z.infer<typeof suspiciousListQuerySchema>;

// ── Query params for duplicates list ──
export const duplicatesListQuerySchema = z.object({
  minScore: z.coerce.number().min(0).max(1).default(0.6),
  confirmed: z.enum(["PENDING", "YES", "NO", "ALL"]).default("PENDING"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type DuplicatesListQuery = z.infer<typeof duplicatesListQuerySchema>;

// ── Status update ──
export const officerStatusUpdateSchema = z.object({
  newStatus: z.nativeEnum(ComplaintStatus),
  remarks: z.string().trim().max(2000).optional(),
});
export type OfficerStatusUpdateInput = z.infer<typeof officerStatusUpdateSchema>;

// ── Override AI category / priority / department ──
export const overrideAnalysisSchema = z.object({
  category: z.nativeEnum(Category).optional(),
  priority: z.nativeEnum(Priority).optional(),
  departmentId: z.string().cuid().optional(),
  reason: z.string().trim().min(5).max(1000),
});
export type OverrideAnalysisInput = z.infer<typeof overrideAnalysisSchema>;

// ── Request more info from citizen ──
export const requestInfoSchema = z.object({
  message: z.string().trim().min(10).max(2000),
});
export type RequestInfoInput = z.infer<typeof requestInfoSchema>;

// ── Resolve complaint ──
export const resolveComplaintSchema = z.object({
  remarks: z.string().trim().min(10).max(2000),
  evidenceUrls: z
    .array(
      z.object({
        imageUrl: z.string().url(),
        storageKey: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
        sizeBytes: z.number().int().positive().optional(),
      }),
    )
    .max(5)
    .default([]),
});
export type ResolveComplaintInput = z.infer<typeof resolveComplaintSchema>;

// ── Reject ──
export const rejectComplaintSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});
export type RejectComplaintInput = z.infer<typeof rejectComplaintSchema>;

// ── Suspicious review decision ──
export const suspicionDecisionSchema = z.object({
  decision: z.enum(["CLEARED", "CONFIRMED"]),
  notes: z.string().trim().max(2000).optional(),
});
export type SuspicionDecisionInput = z.infer<typeof suspicionDecisionSchema>;

// ── Duplicate confirmation / merge ──
export const duplicateDecisionSchema = z.object({
  decision: z.enum(["MERGE", "KEEP_SEPARATE"]),
  primaryComplaintId: z.string().cuid().optional(), // which one is the "real" ticket
  notes: z.string().trim().max(2000).optional(),
});
export type DuplicateDecisionInput = z.infer<typeof duplicateDecisionSchema>;

// ── State machine: which transitions are allowed from each status ──
export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED:         ["AI_ANALYSIS", "ASSIGNED", "REJECTED", "CANCELLED"],
  AI_ANALYSIS:       ["ASSIGNED", "REJECTED", "CANCELLED"],
  ASSIGNED:          ["IN_PROGRESS", "NEEDS_INFORMATION", "REJECTED", "DUPLICATE", "CANCELLED"],
  IN_PROGRESS:       ["RESOLVED", "NEEDS_INFORMATION", "REJECTED", "DUPLICATE"],
  NEEDS_INFORMATION: ["IN_PROGRESS", "REJECTED", "CANCELLED"],
  RESOLVED:          [], // terminal
  DUPLICATE:         [], // terminal
  REJECTED:          [], // terminal
  CANCELLED:         [], // terminal
};

export function canTransition(from: ComplaintStatus, to: ComplaintStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}