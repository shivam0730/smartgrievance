import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/officer/priority-badge";
import { CATEGORY_LABEL, STATUS_LABEL, formatRelative } from "@/lib/format";
import type { Category, ComplaintStatus, Priority } from "@/generated/prisma/client";

type RowItem = {
  id: string;
  ticketNumber: string;
  title: string;
  category: Category;
  status: ComplaintStatus;
  priority: Priority;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  user: { name: string };
  _count?: { images: number };
};

const STATUS_VARIANT: Record<ComplaintStatus, string> = {
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

export function ComplaintRow({ item, href }: { item: RowItem; href?: string }) {
  const url = href ?? `/officer/complaints/${item.id}`;
  return (
    <Link
      href={url}
      className="block rounded-md border bg-background p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{item.ticketNumber}</span>
            <Badge className={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
            <PriorityBadge priority={item.priority} />
          </div>
          <p className="mt-1 truncate text-sm font-medium">{item.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {CATEGORY_LABEL[item.category]} · {item.address}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-xs text-muted-foreground">{formatRelative(item.updatedAt)}</span>
          <span className="text-xs text-muted-foreground">by {item.user.name}</span>
        </div>
      </div>
    </Link>
  );
}