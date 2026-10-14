import type { ComplaintStatus, Priority } from "@/generated/prisma/client";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const BASE = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

const STATUS_STYLES: Record<ComplaintStatus, string> = {
  SUBMITTED: "border-slate-300 bg-slate-100 text-slate-800",
  AI_ANALYSIS: "border-indigo-200 bg-indigo-50 text-indigo-800",
  ASSIGNED: "border-blue-200 bg-blue-50 text-blue-800",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-900",
  RESOLVED: "border-green-200 bg-green-50 text-green-800",
  NEEDS_INFORMATION: "border-orange-200 bg-orange-50 text-orange-900",
  DUPLICATE: "border-purple-200 bg-purple-50 text-purple-800",
  REJECTED: "border-red-200 bg-red-50 text-red-800",
  CANCELLED: "border-slate-300 bg-slate-100 text-slate-600",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "border-green-200 bg-green-50 text-green-800",
  MEDIUM: "border-yellow-200 bg-yellow-50 text-yellow-900",
  HIGH: "border-orange-200 bg-orange-50 text-orange-900",
  CRITICAL: "border-red-300 bg-red-50 text-red-800",
};

// Always text + colour (never colour alone)
export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={cn(BASE, STATUS_STYLES[status])}>{STATUS_LABEL[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cn(BASE, PRIORITY_STYLES[priority])}>{PRIORITY_LABEL[priority]}</span>;
}
