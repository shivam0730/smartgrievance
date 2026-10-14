import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/officer/status-badge";
import { formatDateTime } from "@/lib/format";
import type { ComplaintStatus } from "@/generated/prisma/client";

type Entry = {
  id: string;
  oldStatus: ComplaintStatus | null;
  newStatus: ComplaintStatus;
  remarks: string | null;
  createdAt: Date;
  changedBy: { id: string; name: string; role: string } | null;
};

export function StatusTimeline({ history }: { history: Entry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-muted pl-5">
            {history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-background bg-blue-700" />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={h.newStatus} />
                  {h.oldStatus && (
                    <span className="text-xs text-muted-foreground">
                      from {h.oldStatus}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(h.createdAt)}
                  {h.changedBy && (
                    <>
                      {" · "}
                      {h.changedBy.name}{" "}
                      <span className="text-xs">({h.changedBy.role})</span>
                    </>
                  )}
                </p>
                {h.remarks && (
                  <p className="mt-1 text-sm">{h.remarks}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}