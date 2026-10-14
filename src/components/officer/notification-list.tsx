"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  markAllOfficerNotificationsReadAction,
  markOfficerNotificationReadAction,
} from "@/lib/officer/actions";
import { formatRelative } from "@/lib/format";
import type { NotificationType } from "@/generated/prisma/client";

type Item = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  complaint: {
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
  } | null;
};

const TYPE_TONE: Partial<Record<NotificationType, string>> = {
  CRITICAL_COMPLAINT: "bg-red-100 text-red-800",
  SUSPICIOUS_COMPLAINT: "bg-red-100 text-red-800",
  DUPLICATE_ALERT: "bg-amber-100 text-amber-800",
  OFFICER_ASSIGNED: "bg-sky-100 text-sky-800",
  REASSIGNED: "bg-sky-100 text-sky-800",
  INFO_REQUESTED: "bg-purple-100 text-purple-800",
  COMPLAINT_RESOLVED: "bg-emerald-100 text-emerald-800",
  DEPARTMENT_OVERLOAD: "bg-amber-100 text-amber-800",
  AI_ANOMALY: "bg-red-100 text-red-800",
};

export function NotificationList({
  items,
  unreadCount,
  filter,
}: {
  items: Item[];
  unreadCount: number;
  filter: "all" | "unread";
}) {
  const [pending, start] = useTransition();

  const markOne = (id: string) => {
    start(async () => {
      const res = await markOfficerNotificationReadAction(id);
      if (!res.ok) toast.error(res.error);
    });
  };

  const markAll = () => {
    start(async () => {
      const res = await markAllOfficerNotificationsReadAction();
      if (!res.ok) toast.error(res.error);
      else toast.success("All notifications marked as read");
    });
  };

  return (
    <div className="space-y-3">
      {/* Filter + action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <Link
            href="/officer/notifications?filter=all"
            className={`rounded-md border px-3 py-1.5 ${
              filter === "all" ? "bg-muted font-medium" : "hover:bg-muted"
            }`}
          >
            All
          </Link>
          <Link
            href="/officer/notifications?filter=unread"
            className={`rounded-md border px-3 py-1.5 ${
              filter === "unread" ? "bg-muted font-medium" : "hover:bg-muted"
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Link>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAll}
            disabled={pending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          No notifications {filter === "unread" ? "unread" : "yet"}.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-md border bg-background p-3 ${
                !n.isRead ? "border-l-4 border-l-blue-600" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        TYPE_TONE[n.type] ?? "bg-slate-100 text-slate-700"
                      }
                    >
                      {n.type.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {n.message}
                  </p>
                  {n.complaint && (
                    <Link
                      href={`/officer/complaints/${n.complaint.id}`}
                      className="mt-1 inline-block text-xs text-blue-700 hover:underline"
                    >
                      {n.complaint.ticketNumber} → open
                    </Link>
                  )}
                </div>
                {!n.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markOne(n.id)}
                    disabled={pending}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}