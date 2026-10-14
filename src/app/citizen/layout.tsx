import type { ReactNode } from "react";
import { PortalShell } from "@/components/shared/portal-shell";
import { requireRole } from "@/lib/auth/current-user";
import { getUnreadCount } from "@/lib/data/notifications";

export default async function CitizenLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["CITIZEN"]);
  const unread = await getUnreadCount(user.id);

  return (
    <PortalShell
      title="Citizen Portal"
      userName={user.name}
      nav={[
        { href: "/citizen/dashboard", label: "Dashboard" },
        { href: "/citizen/complaints", label: "My Complaints" },
        { href: "/citizen/complaints/new", label: "Report Issue" },
        { href: "/citizen/notifications", label: unread > 0 ? `Notifications (${unread})` : "Notifications" },
        { href: "/citizen/profile", label: "Profile" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
