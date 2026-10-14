import type { ReactNode } from "react";
import { PublicShell } from "./public-shell";

export function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <div className="mt-6 space-y-4 text-slate-700">{children}</div>
      </div>
    </PublicShell>
  );
}
