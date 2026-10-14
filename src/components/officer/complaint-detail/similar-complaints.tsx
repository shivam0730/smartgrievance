import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";

type Similar = {
  id: string;
  overallScore: number;
  distanceMeters: number | null;
  isConfirmedDuplicate: boolean | null;
  other: {
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    address: string;
  };
};

export function SimilarComplaints({
  items,
  similarityIds,
}: {
  items: Similar[];
  similarityIds: Record<string, string>; // complaintId -> similarityId
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Similar complaints</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No similar complaints found.
          </p>
        ) : (
          items.map((s) => (
            <Link
              key={s.id}
              href={`/officer/duplicates/${similarityIds[s.other.id] ?? ""}`}
              className="block rounded-md border p-3 hover:bg-muted/50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800">
                  {formatPercent(s.overallScore)} match
                </Badge>
                {s.isConfirmedDuplicate === true && (
                  <Badge className="bg-red-100 text-red-800">Confirmed</Badge>
                )}
                {s.isConfirmedDuplicate === false && (
                  <Badge variant="secondary">Cleared</Badge>
                )}
              </div>
              <p className="mt-1 truncate text-sm font-medium">
                {s.other.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {s.other.ticketNumber} · {s.other.address}
              </p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}