import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/officer/empty-state";
import { ComplaintRow } from "@/components/officer/complaint-row";
import { getOfficerRecentAssignments } from "@/lib/data/officer";

export async function RecentAssignments({ officerId }: { officerId: string }) {
  const items = await getOfficerRecentAssignments(officerId, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent assignments</CardTitle>
        <Link href="/officer/complaints" className="text-xs text-blue-700 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <EmptyState title="No assignments yet" description="You have not been assigned any complaints." />
        ) : (
          items.map((c) => <ComplaintRow key={c.id} item={c} />)
        )}
      </CardContent>
    </Card>
  );
}