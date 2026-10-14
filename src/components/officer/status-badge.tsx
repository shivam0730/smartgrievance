import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/format";
import type { ComplaintStatus } from "@/generated/prisma/client";

const VARIANT: Record<ComplaintStatus, string> = {
  SUBMITTED:         "bg-slate-100 text-slate-700",
  AI_ANALYSIS:       "bg-indigo-100 text-indigo-700",
  ASSIGNED:          "bg-sky-100 text-sky-700",
  IN_PROGRESS:       "bg-amber-100 text-amber-800",
  RESOLVED:          "bg-emerald-100 text-emerald-800",
  NEEDS_INFORMATION: "bg-purple-100 text-purple-700",
  DUPLICATE:         "bg-gray-100 text-gray-700",
  REJECTED:          "bg-red-100 text-red-700",
  CANCELLED:         "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <Badge className={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}