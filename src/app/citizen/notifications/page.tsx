import Link from "next/link";
import { MarkAllReadButton, MarkReadButton } from "@/components/shared/mark-read-buttons";
import { requireRole } from "@/lib/auth/current-user";
import { getUnreadCount, listNotifications } from "@/lib/data/notifications";
import { formatDateTime } from "@/lib/format";
import { notificationsQuerySchema } from "@/lib/validations/feedback";

export const metadata = { title: "Notifications | SmartGrievance" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

const TABS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
] as const;

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(["CITIZEN"]);
  const sp = await searchParams;
  const parsed = notificationsQuerySchema.safeParse({ filter: first(sp.filter), page: first(sp.page) });
  const query = parsed.success ? parsed.data : { filter: "all" as const, page: 1 };

  const [{ items, total, totalPages }, unread] = await Promise.all([
    listNotifications(user.id, query),
    getUnreadCount(user.id),
  ]);

  const href = (filter: string, page = 1) => `/citizen/notifications?filter=${filter}&page=${page}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      <nav aria-label="Filter notifications" className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={href(t.value)}
            aria-current={query.filter === t.value ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              query.filter === t.value ? "border-blue-800 bg-blue-800 text-white" : "hover:bg-muted"
            }`}
          >
            {t.label}
            {t.value === "unread" && unread > 0 ? ` (${unread})` : ""}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="rounded-xl border bg-background p-8 text-center text-muted-foreground">No notifications found.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border bg-background p-4 ${n.isRead ? "" : "border-l-4 border-l-blue-800"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {n.title}
                    {!n.isRead && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-900">
                        Unread
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {n.complaintId && (
                    <Link
                      href={`/citizen/complaints/${n.complaintId}`}
                      className="rounded-md border px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-muted"
                    >
                      View complaint
                    </Link>
                  )}
                  {!n.isRead && <MarkReadButton id={n.id} />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {total} notification{total === 1 ? "" : "s"} · Page {query.page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {query.page > 1 && (
            <Link href={href(query.filter, query.page - 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">
              Previous
            </Link>
          )}
          {query.page < totalPages && (
            <Link href={href(query.filter, query.page + 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
