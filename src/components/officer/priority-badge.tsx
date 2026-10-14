import { Badge } from "@/components/ui/badge";
import type { Priority } from "@/generated/prisma/client";
import { PRIORITY_LABEL } from "@/lib/format";

const VARIANT: Record<Priority, string> = {
  LOW:      "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  MEDIUM:   "bg-amber-100 text-amber-800 hover:bg-amber-100",
  HIGH:     "bg-orange-100 text-orange-800 hover:bg-orange-100",
  CRITICAL: "bg-red-100 text-red-800 hover:bg-red-100",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge className={VARIANT[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}