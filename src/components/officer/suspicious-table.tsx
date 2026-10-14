import Link from "next/link";
import { SuspicionBadge } from "@/components/officer/suspicion-badge";
import { ReviewStatusBadge } from "@/components/officer/review-status-badge";
import { PriorityBadge } from "@/components/officer/priority-badge";
import { CATEGORY_LABEL, formatRelative } from "@/lib/format";
import type { Category, Priority, HumanReviewStatus } from "@/generated/prisma/client";

type Row = {
  id: string;
  suspicionScore: number;
  suspicionReasons: unknown;
  reviewStatus: HumanReviewStatus;
  reviewedAt: Date | null;
  reviewedBy: { name: string } | null;
  complaint: {
    id: string;
    ticketNumber: string;
    title: string;
    category: Category;
    priority: Priority;
    address: string;
    updatedAt: Date;
    user: { name: string };
  };
};

function firstReason(reasons: unknown): string | null {
  if (!Array.isArray(reasons)) return null;
  const first = reasons[0];
  return typeof first === "string" ? first : null;
}

export function SuspiciousTable({ items }: { items: Row[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border bg-background p-8 text-center">
        <p className="text-sm font-medium">No suspicious complaints</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting the score filter or review status.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-md border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Ticket</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Suspicion</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Review</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-muted/40">
                <td className="px-3 py-2 font-mono text-xs">
                  {it.complaint.ticketNumber}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/officer/suspicious/${it.complaint.id}`}
                    className="line-clamp-1 font-medium hover:text-blue-700 hover:underline"
                  >
                    {it.complaint.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {it.complaint.user.name} · {it.complaint.address}
                  </p>
                </td>
                <td className="px-3 py-2">
                  {CATEGORY_LABEL[it.complaint.category]}
                </td>
                <td className="px-3 py-2">
                  <PriorityBadge priority={it.complaint.priority} />
                </td>
                <td className="px-3 py-2">
                  <SuspicionBadge score={it.suspicionScore} />
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {firstReason(it.suspicionReasons) ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <ReviewStatusBadge status={it.reviewStatus} />
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {formatRelative(it.complaint.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {items.map((it) => (
          <Link
            key={it.id}
            href={`/officer/suspicious/${it.complaint.id}`}
            className="block rounded-md border bg-background p-3 hover:bg-muted/50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {it.complaint.ticketNumber}
              </span>
              <SuspicionBadge score={it.suspicionScore} />
              <ReviewStatusBadge status={it.reviewStatus} />
            </div>
            <p className="mt-1 truncate text-sm font-medium">
              {it.complaint.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {CATEGORY_LABEL[it.complaint.category]} · {it.complaint.user.name}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}