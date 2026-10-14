import { Check, Circle } from "lucide-react";
import type { ComplaintStatus } from "@/generated/prisma/client";
import { STATUS_LABEL, formatDateTime } from "@/lib/format";

const FLOW: ComplaintStatus[] = ["SUBMITTED", "AI_ANALYSIS", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

type HistoryItem = { id: string; newStatus: ComplaintStatus; remarks: string | null; createdAt: Date };

export function StatusTimeline({ current, history }: { current: ComplaintStatus; history: HistoryItem[] }) {
  const reached = new Set(history.map((h) => h.newStatus));
  const offPath = !FLOW.includes(current);

  return (
    <div>
      <ol className="space-y-3">
        {FLOW.map((s) => {
          const done = reached.has(s);
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              {done ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check className="size-3" aria-hidden="true" />
                </span>
              ) : (
                <Circle className="size-5 text-slate-300" aria-hidden="true" />
              )}
              <span className={done ? "font-medium" : "text-muted-foreground"}>
                {STATUS_LABEL[s]}
                <span className="sr-only">{done ? " (completed)" : " (not reached yet)"}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {offPath && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Current status: <strong>{STATUS_LABEL[current]}</strong>
        </p>
      )}

      <h3 className="mt-6 text-sm font-semibold">History</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {[...history].reverse().map((h) => (
          <li key={h.id} className="border-l-2 pl-3">
            <p className="font-medium">{STATUS_LABEL[h.newStatus]}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</p>
            {h.remarks && <p className="text-muted-foreground">{h.remarks}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
