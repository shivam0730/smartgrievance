import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/officer/priority-badge";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  formatDateTime,
  formatRelative,
} from "@/lib/format";
import type { Category, ComplaintStatus, Priority } from "@/generated/prisma/client";

type Row = {
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
  department: { name: string } | null;
  assignedOfficer: { name: string } | null;
  aiAnalysis: {
    duplicateScore: number;
    suspicionScore: number;
    reviewStatus: string;
  } | null;
  _count: { images: number };
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

export function ComplaintsTable({ items }: { items: Row[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-background p-8 text-center">
        <p className="text-sm font-medium">No complaints found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try changing your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-md border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Ticket</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">AI Risk</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-muted/40">
                <td className="px-3 py-2 font-mono text-xs">{it.ticketNumber}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/officer/complaints/${it.id}`}
                    className="line-clamp-1 font-medium hover:text-blue-700 hover:underline"
                  >
                    {it.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {it.address}
                  </p>
                </td>
                <td className="px-3 py-2">{CATEGORY_LABEL[it.category]}</td>
                <td className="px-3 py-2">
                  <Badge className={STATUS_VARIANT[it.status]}>
                    {STATUS_LABEL[it.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <PriorityBadge priority={it.priority} />
                </td>
                <td className="px-3 py-2 text-xs">
                  {it.aiAnalysis ? (
                    <div className="flex flex-col gap-0.5">
                      <span>
                        Susp:{" "}
                        <span
                          className={
                            it.aiAnalysis.suspicionScore >= 60
                              ? "font-semibold text-red-700"
                              : "text-muted-foreground"
                          }
                        >
                          {it.aiAnalysis.suspicionScore}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Dup: {Math.round(it.aiAnalysis.duplicateScore * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  <span title={formatDateTime(it.updatedAt)}>
                    {formatRelative(it.updatedAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {items.map((it) => (
          <Link
            key={it.id}
            href={`/officer/complaints/${it.id}`}
            className="block rounded-md border bg-background p-3 hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {it.ticketNumber}
              </span>
              <Badge className={STATUS_VARIANT[it.status]}>
                {STATUS_LABEL[it.status]}
              </Badge>
              <PriorityBadge priority={it.priority} />
            </div>
            <p className="mt-1 truncate text-sm font-medium">{it.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {CATEGORY_LABEL[it.category]} · {it.address}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelative(it.updatedAt)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}