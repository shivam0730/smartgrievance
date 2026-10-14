import "server-only";
import { prisma } from "@/lib/db";

export const NOTIFICATION_PAGE_SIZE = 15;

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function listNotifications(
  userId: string,
  opts: { filter: "all" | "unread" | "read"; page: number },
) {
  const where = {
    userId, // users only ever see their own notifications
    ...(opts.filter === "unread" ? { isRead: false } : opts.filter === "read" ? { isRead: true } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * NOTIFICATION_PAGE_SIZE,
      take: NOTIFICATION_PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
  ]);
  return { items, total, totalPages: Math.max(1, Math.ceil(total / NOTIFICATION_PAGE_SIZE)) };
}
