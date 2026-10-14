import type { ReactNode } from "react";
import { PortalShell } from "@/components/shared/portal-shell";
import { requireRole } from "@/lib/auth/current-user";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["ADMIN"]);
  return (
    <PortalShell
      title="Admin Portal"
      userName={user.name}
      nav={[{ href: "/admin/dashboard", label: "Dashboard" }]}
    >
      {children}
    </PortalShell>
  );
}
