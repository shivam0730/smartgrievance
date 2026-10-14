import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/officer/empty-state";
import { listDuplicatePairs } from "@/lib/data/officer";
import { formatPercent } from "@/lib/format";

export async function DuplicateAlerts({
  officerId,
  departmentId,
}: {
  officerId: string;
  departmentId: string | null;
}) {
  const { items } = await listDuplicatePairs(officerId, departmentId, {
    minScore: 0.6,
    confirmed: "PENDING",
    page: 1,
    pageSize: 5,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Potential duplicates</CardTitle>
        <Link href="/officer/duplicates" className="text-xs text-blue-700 hover:underline">
          Review
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <EmptyState title="No duplicate pairs" description="No similar complaints flagged yet." />
        ) : (
          items.map((p) => (
            <Link
              key={p.id}
              href={`/officer/duplicates/${p.id}`}
              className="block rounded-md border border-amber-200 bg-amber-50/50 p-3 transition-colors hover:bg-amber-50"
            >
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800">
                  {formatPercent(p.overallScore)} match
                </Badge>
                <span className="text-xs text-muted-foreground">Similarity score</span>
              </div>
              <p className="mt-1 truncate text-sm font-medium">{p.complaintA.title}</p>
              <p className="text-xs text-muted-foreground">vs</p>
              <p className="truncate text-sm font-medium">{p.complaintB.title}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}