import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/officer/empty-state";
import { getOfficerAIAlerts } from "@/lib/data/officer";
import { formatRelative, suspicionLevel } from "@/lib/format";

export async function AIAlerts({
  officerId,
  departmentId,
}: {
  officerId: string;
  departmentId: string | null;
}) {
  const alerts = await getOfficerAIAlerts(officerId, departmentId, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">AI alerts — human review required</CardTitle>
        <Link href="/officer/suspicious" className="text-xs text-blue-700 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <EmptyState title="No AI alerts" description="No suspicious complaints awaiting review." />
        ) : (
          alerts.map((a) => {
            const level = suspicionLevel(a.suspicionScore);
            return (
              <Link
                key={a.id}
                href={`/officer/suspicious/${a.complaint.id}`}
                className="block rounded-md border border-red-200 bg-red-50/50 p-3 transition-colors hover:bg-red-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {a.complaint.ticketNumber}
                      </span>
                      <Badge className="bg-red-100 text-red-800">
                        Suspicion {a.suspicionScore}/100 · {level}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{a.complaint.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {a.complaint.address}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(a.complaint.updatedAt)}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}