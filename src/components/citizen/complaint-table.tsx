import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { CATEGORY_LABEL, formatDate } from "@/lib/format";
import type { Category, ComplaintStatus, Priority } from "@/generated/prisma/client";

type Row = {
  id: string;
  ticketNumber: string;
  title: string;
  category: Category;
  status: ComplaintStatus;
  priority: Priority;
  createdAt: Date;
};

export function ComplaintTable({ items }: { items: Row[] }) {
  if (items.length === 0) {
    return <p className="rounded-xl border bg-background p-8 text-center text-muted-foreground">No complaints found.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">ID</th>
            <th scope="col" className="px-4 py-3">Title</th>
            <th scope="col" className="px-4 py-3">Category</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Priority</th>
            <th scope="col" className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{c.ticketNumber}</td>
              <td className="px-4 py-3">
                <Link href={`/citizen/complaints/${c.id}`} className="font-medium text-blue-800 hover:underline">
                  {c.title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{CATEGORY_LABEL[c.category]}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
              <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
