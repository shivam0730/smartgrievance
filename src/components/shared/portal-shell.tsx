import Link from "next/link";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

type NavItem = { href: string; label: string };

export function PortalShell({
  title,
  userName,
  nav,
  notificationHref,
  notificationCount,
  children,
}: {
  title: string;
  userName: string;
  nav: NavItem[];
  notificationHref?: string;              // ← NEW
  notificationCount?: number;             // ← NEW
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold">
              SmartGrievance
            </Link>
            <Badge variant="secondary">{title}</Badge>
            <nav className="hidden gap-4 text-sm md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {notificationHref && (                       // ← NEW block
              <Link
                href={notificationHref}
                className="relative inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground"
                aria-label="Notifications"
              >
                <span className="hidden sm:inline">Alerts</span>
                {typeof notificationCount === "number" && notificationCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-medium text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
            )}
            <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}