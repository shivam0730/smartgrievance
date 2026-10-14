"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { primaryCta, outlineCta } from "@/lib/cta";

type Props = {
  links: { href: string; label: string }[];
  isSignedIn: boolean;
  reportHref: string;
  loginHref: string;
  dashboardHref: string;
};

export function MobileNav({ links, isSignedIn, reportHref, loginHref, dashboardHref }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-10 items-center justify-center rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>

      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-16 border-b bg-white p-4 shadow-md">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="rounded-md px-3 py-2 font-medium text-slate-800 hover:bg-slate-100">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link href={isSignedIn ? dashboardHref : loginHref} onClick={close} className={outlineCta}>
              {isSignedIn ? "Dashboard" : "Login"}
            </Link>
            <Link href={reportHref} onClick={close} className={primaryCta}>
              Report an Issue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
