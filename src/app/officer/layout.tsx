import type { ReactNode } from "react";
import { PortalShell } from "@/components/shared/portal-shell";
import { requireOfficer } from "@/lib/auth/current-user";
import { getOfficerUnreadNotificationCount } from "@/lib/data/officer";

const OFFICER_NAV = [
  { href: "/officer/dashboard",     label: "Dashboard" },
  { href: "/officer/complaints",    label: "Complaints" },
  // { href: "/officer/ai-review",     label: "AI Review" },
  { href: "/officer/suspicious",    label: "Suspicious" },
  { href: "/officer/duplicates",    label: "Duplicates" },
  { href: "/officer/map",           label: "Map" },
  { href: "/officer/notifications", label: "Notifications" },
] as const;

export default async function OfficerLayout({ children }: { children: ReactNode }) {
  const user = await requireOfficer();
  const unread = await getOfficerUnreadNotificationCount(user.id);

  return (
    <PortalShell
      title="Officer Portal"
      userName={user.name}
      nav={[...OFFICER_NAV]}
      notificationHref="/officer/notifications"
      notificationCount={unread}
    >
      {children}
    </PortalShell>
  );
}