import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/officer/priority-badge";
import { CATEGORY_LABEL, formatPercent, formatRelative } from "@/lib/format";
import type { Category, Priority, ComplaintStatus } from "@/generated/prisma/client";

type PairItem = {
  id: string;
  overallScore: number;
  distanceMeters: number | null;
  isConfirmedDuplicate: boolean | null;
  complaintA: {
    id: string;
    ticketNumber: string;
    title: string;
    category: Category;
    priority: Priority;
    status: ComplaintStatus;
    address: string;
    updatedAt: Date;
  };
  complaintB: {
    id: string;
    ticketNumber: string;
    title: string;
    category: Category;
    priority: Priority;
    status: ComplaintStatus;
    address: string;
    updatedAt: Date;
  };
};

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-700",
  AI_ANALYSIS: "bg-indigo-100 text-indigo-700",
  ASSIGNED: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  NEEDS_INFORMATION: "bg-purple-100 text-purple-700",
  DUPLICATE: "bg-gray-100 text-gray-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export function DuplicatesTable({ items }: { items: PairItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-background p-8 text-center">
        <p className="text-sm font-medium">No similar complaints to review</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting the score or review state filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((p) => (
        <Link
          key={p.id}
          href={`/officer/duplicates/${p.id}`}
          className="block rounded-md border bg-background p-4 hover:bg-muted/50"
        >
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800">
                {formatPercent(p.overallScore)} match
              </Badge>
              {p.isConfirmedDuplicate === true && (
                <Badge className="bg-red-100 text-red-800">
                  Confirmed duplicate
                </Badge>
              )}
              {p.isConfirmedDuplicate === false && (
                <Badge variant="secondary">Marked separate</Badge>
              )}
              {p.isConfirmedDuplicate === null && (
                <Badge className="bg-amber-100 text-amber-800">
                  Pending
                </Badge>
              )}
              {p.distanceMeters !== null && (
                <span className="text-xs text-muted-foreground">
                  {p.distanceMeters < 1000
                    ? `${Math.round(p.distanceMeters)} m apart`
                    : `${(p.distanceMeters / 1000).toFixed(2)} km apart`}
                </span>
              )}
            </div>
          </div>

          {/* Two-column comparison preview */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[p.complaintA, p.complaintB].map((c, idx) => (
              <div key={c.id} className="rounded border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {idx === 0 ? "A" : "B"} · {c.ticketNumber}
                  </span>
                  <Badge className={STATUS_BADGE[c.status] ?? ""}>{c.status}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm font-medium">{c.title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {CATEGORY_LABEL[c.category]} · {c.address}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <PriorityBadge priority={c.priority} />
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(c.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}