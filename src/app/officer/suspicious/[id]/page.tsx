import { notFound } from "next/navigation";
import { requireOfficer } from "@/lib/auth/current-user";
import { getOfficerComplaintById } from "@/lib/data/officer";
import { SuspicionBadge } from "@/components/officer/suspicion-badge";
import { SuspiciousReviewPanel } from "@/components/officer/suspicious-review-panel";
import { StatusBadge } from "@/components/officer/status-badge";
import { PriorityBadge } from "@/components/officer/priority-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Suspicious Review | Officer | SmartGrievance" };

export default async function OfficerSuspiciousReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOfficer();
  const { id } = await params;

  const complaint = await getOfficerComplaintById(
    id,
    user.id,
    user.departmentId,
  );
  if (!complaint || !complaint.aiAnalysis) notFound();

  const a = complaint.aiAnalysis;
  const reasons = Array.isArray(a.suspicionReasons)
    ? (a.suspicionReasons as string[])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-muted-foreground">
            {complaint.ticketNumber}
          </p>
          <h1 className="text-2xl font-bold">{complaint.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="text-sm text-muted-foreground">
              {CATEGORY_LABEL[complaint.category]}
            </span>
          </div>
        </div>
        <Link
          href={`/officer/complaints/${complaint.id}`}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          View full complaint
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: complaint content */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Complaint details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Submitted by
                </p>
                <p>
                  {complaint.user.name} · {complaint.user.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Description
                </p>
                <p className="whitespace-pre-wrap">{complaint.description}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Address
                </p>
                <p>{complaint.address}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Submitted
                </p>
                <p>{formatDateTime(complaint.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {complaint.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Photos ({complaint.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {complaint.images
                    .filter((i) => i.kind === "COMPLAINT")
                    .map((img) => (
                      <a
                        key={img.id}
                        href={img.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square overflow-hidden rounded-md border bg-muted"
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
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: AI suspicion analysis + review panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI suspicion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <SuspicionBadge score={a.suspicionScore} />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Duplicate score
                </p>
                <p className="text-sm">
                  {Math.round(a.duplicateScore * 100)}%
                </p>
              </div>

              {reasons.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Reasons
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                    {reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {a.reasoning && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    AI notes
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.reasoning}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Human review</CardTitle>
            </CardHeader>
            <CardContent>
              <SuspiciousReviewPanel
                complaintId={complaint.id}
                currentStatus={a.reviewStatus}
                reviewedByName={a.reviewedBy?.name ?? null}
                reviewedAt={a.reviewedAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}