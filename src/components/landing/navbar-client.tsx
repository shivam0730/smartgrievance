"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { NAV_LINKS, ROUTES } from "@/constants/site";
import { outlineCta, primaryCta } from "@/lib/cta";
import { MobileNav } from "./mobile-nav";

export function NavbarClient({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-blue-950">
          <Landmark className="size-6 text-blue-800" aria-hidden="true" />
          SmartGrievance
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-700 hover:text-blue-900">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href={isSignedIn ? ROUTES.dashboard : ROUTES.login} className={outlineCta}>
            {isSignedIn ? "Dashboard" : "Login"}
          </Link>
          <Link href={ROUTES.report} className={primaryCta}>
            Report an Issue
          </Link>
        </div>

        <MobileNav
          links={NAV_LINKS}
          isSignedIn={isSignedIn}
          reportHref={ROUTES.report}
          loginHref={ROUTES.login}
          dashboardHref={ROUTES.dashboard}
        />
      </div>
    </header>
  );
}