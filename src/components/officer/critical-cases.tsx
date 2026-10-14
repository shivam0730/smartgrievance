import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/officer/empty-state";
import { ComplaintRow } from "@/components/officer/complaint-row";
import { getOfficerCriticalCases } from "@/lib/data/officer";

export async function CriticalCases({
  officerId,
  departmentId,
}: {
  officerId: string;
  departmentId: string | null;
}) {
  const items = await getOfficerCriticalCases(officerId, departmentId, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Critical cases</CardTitle>
        <Link href="/officer/complaints?priority=CRITICAL" className="text-xs text-blue-700 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <EmptyState title="No critical cases" description="All clear for now." />
        ) : (
          items.map((c) => <ComplaintRow key={c.id} item={c} />)
        )}
      </CardContent>
    </Card>
  );
}