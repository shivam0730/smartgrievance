import Link from "next/link";
import { Plus } from "lucide-react";
import { ComplaintTable } from "@/components/citizen/complaint-table";
import { requireRole } from "@/lib/auth/current-user";
import { getCitizenStats, getRecentNotifications, listCitizenComplaints } from "@/lib/data/complaints";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Dashboard | SmartGrievance" };

export default async function CitizenDashboardPage() {
  const user = await requireRole(["CITIZEN"]);
  const [stats, recent, notifications] = await Promise.all([
    getCitizenStats(user.id),
    listCitizenComplaints(user.id, { page: 1, pageSize: 5 }),
    getRecentNotifications(user.id, 3),
  ]);

  const cards = [
    { label: "Total Complaints", value: stats.total },
    { label: "Pending", value: stats.pending },
    { label: "In Progress", value: stats.inProgress },
    { label: "Resolved", value: stats.resolved },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">Here is the status of your complaints.</p>
        </div>
        <Link
          href="/citizen/complaints/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-800 px-4 text-sm font-medium text-white hover:bg-blue-900"
        >
          <Plus className="size-4" aria-hidden="true" /> Report New Issue
        </Link>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-background p-5">
            <dt className="text-sm text-muted-foreground">{c.label}</dt>
            <dd className="mt-1 text-3xl font-bold">{c.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Complaints</h2>
          <Link href="/citizen/complaints" className="text-sm text-blue-800 hover:underline">
            View all
          </Link>
        </div>
        <ComplaintTable items={recent.items} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest Updates</h2>
          <Link href="/citizen/notifications" className="text-sm text-blue-800 hover:underline">
            View all
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="rounded-lg border bg-background p-4 text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
