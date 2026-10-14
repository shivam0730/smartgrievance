import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOfficer } from "@/lib/auth/current-user";
import { getDuplicatePairById } from "@/lib/data/officer";
import { DuplicateDecisionPanel } from "@/components/officer/duplicate-decision-panel";
import { PriorityBadge } from "@/components/officer/priority-badge";
import { StatusBadge } from "@/components/officer/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CATEGORY_LABEL,
  formatDateTime,
  formatDistance,
  formatPercent,
} from "@/lib/format";

export const metadata = { title: "Duplicate Compare | Officer | SmartGrievance" };

export default async function DuplicateComparePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOfficer();
  const { id } = await params;

  const pair = await getDuplicatePairById(id);
  if (!pair) notFound();

  const access =
    pair.complaintA.assignedOfficerId === user.id ||
    pair.complaintB.assignedOfficerId === user.id ||
    (!!user.departmentId &&
      (pair.complaintA.departmentId === user.departmentId ||
        pair.complaintB.departmentId === user.departmentId));

  if (!access) notFound();

  const a = pair.complaintA;
  const b = pair.complaintB;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Duplicate review</h1>
          <p className="text-sm text-muted-foreground">
            Compare both complaints side by side and decide.
          </p>
        </div>
        <Link
          href="/officer/duplicates"
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          Back to list
        </Link>
      </div>

      {/* Similarity scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Similarity breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Overall</p>
              <p className="font-semibold">{formatPercent(pair.overallScore)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Text</p>
              <p>{formatPercent(pair.textSimilarity)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Image</p>
              <p>{formatPercent(pair.imageSimilarity)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p>{formatPercent(pair.locationSimilarity)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p>{formatDistance(pair.distanceMeters)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side comparison */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { side: "A", c: a },
          { side: "B", c: b },
        ].map(({ side, c }) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>
                  <span className="text-muted-foreground">{side} · </span>
                  {c.ticketNumber}
                </span>
                <Link
                  href={`/officer/complaints/${c.id}`}
                  className="text-xs text-blue-700 hover:underline"
                >
                  Open
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_LABEL[c.category]}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Title</p>
                <p className="font-medium">{c.title}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap text-sm">{c.description}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Address</p>
                <p>{c.address}</p>
                <p className="text-xs text-muted-foreground">
                  {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Submitted by
                </p>
                <p>
                  {c.user.name} · {c.user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(c.createdAt)}
                </p>
              </div>

              {c.images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Photos ({c.images.length})
                  </p>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {c.images
                      .filter((i) => i.kind === "COMPLAINT")
                      .map((img) => (
                        <a
                          key={img.id}
                          href={img.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square overflow-hidden rounded border bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.imageUrl}
                            alt={img.fileName}
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Decision panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your decision</CardTitle>
        </CardHeader>
        <CardContent>
          <DuplicateDecisionPanel
            similarityId={pair.id}
            complaintAId={a.id}
            complaintBId={b.id}
            complaintATicket={a.ticketNumber}
            complaintBTicket={b.ticketNumber}
            currentDecision={pair.isConfirmedDuplicate}
          />
        </CardContent>
      </Card>
    </div>
  );
}