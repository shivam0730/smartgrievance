import { Badge } from "@/components/ui/badge";
import { REVIEW_STATUS_LABEL } from "@/lib/format";
import type { HumanReviewStatus } from "@/generated/prisma/client";

const VARIANT: Record<HumanReviewStatus, string> = {
  NOT_REQUIRED: "bg-slate-100 text-slate-700",
  PENDING:      "bg-amber-100 text-amber-800",
  CLEARED:      "bg-emerald-100 text-emerald-800",
  CONFIRMED:    "bg-red-100 text-red-800",
};

export function ReviewStatusBadge({ status }: { status: HumanReviewStatus }) {
  return <Badge className={VARIANT[status]}>{REVIEW_STATUS_LABEL[status]}</Badge>;
}