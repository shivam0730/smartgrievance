import { requireOfficer } from "@/lib/auth/current-user";
import { listOfficerNotifications } from "@/lib/data/officer";
import { NotificationList } from "@/components/officer/notification-list";
import Link from "next/link";

export const metadata = { title: "Notifications | Officer | SmartGrievance" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function OfficerNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireOfficer();
  const sp = await searchParams;
  const filter = first(sp.filter) === "unread" ? "unread" : "all";
  const page = Number(first(sp.page)) || 1;

  const { items, total, unreadCount, totalPages } =
    await listOfficerNotifications(user.id, {
      unreadOnly: filter === "unread",
      page,
    });

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (filter === "unread") params.set("filter", "unread");
    params.set("page", String(n));
    return `/officer/notifications?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Assignment updates, alerts and system messages.
        </p>
      </div>

      <NotificationList items={items} unreadCount={unreadCount} filter={filter} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {total} notification{total === 1 ? "" : "s"} · Page {page} of{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-md border px-3 py-1.5 hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}