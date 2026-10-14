import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AiAnalysisCard } from "@/components/citizen/ai-analysis-card";
import { CancelButton } from "@/components/citizen/cancel-button";
import { FeedbackSection } from "@/components/citizen/feedback-section";
import { LocationMap } from "@/components/citizen/location-map-dynamic";
import { StatusTimeline } from "@/components/citizen/status-timeline";
import { PriorityBadge, StatusBadge } from "@/components/shared/badges";
import { requireRole } from "@/lib/auth/current-user";
import { CANCELLABLE_STATUSES, getCitizenComplaint } from "@/lib/data/complaints";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";

export const metadata = { title: "Complaint Details | SmartGrievance" };

export default async function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["CITIZEN"]);
  const { id } = await params;
  const complaint = await getCitizenComplaint(user.id, id);
  if (!complaint) notFound();

  const photos = complaint.images.filter((i) => i.kind === "COMPLAINT");
  const evidence = complaint.images.filter((i) => i.kind === "RESOLUTION");
  const osmUrl = `https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`;

  return (
    <div className="space-y-6">
      <Link href="/citizen/complaints" className="text-sm text-blue-800 hover:underline">
        ← Back to my complaints
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{complaint.ticketNumber}</p>
          <h1 className="text-2xl font-bold">{complaint.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>
        {CANCELLABLE_STATUSES.includes(complaint.status) && <CancelButton complaintId={complaint.id} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border bg-background p-5">
            <h2 className="font-semibold">Complaint Information</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Category</dt><dd className="font-medium">{CATEGORY_LABEL[complaint.category]}</dd></div>
              <div><dt className="text-muted-foreground">Submitted</dt><dd className="font-medium">{formatDateTime(complaint.createdAt)}</dd></div>
              <div><dt className="text-muted-foreground">Department</dt><dd className="font-medium">{complaint.department?.name ?? "Not assigned yet"}</dd></div>
              {complaint.resolvedAt && (
                <div><dt className="text-muted-foreground">Resolved</dt><dd className="font-medium">{formatDateTime(complaint.resolvedAt)}</dd></div>
              )}
            </dl>
            <h3 className="mt-5 text-sm text-muted-foreground">Description</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm">{complaint.description}</p>
          </section>

          <section className="rounded-xl border bg-background p-5">
            <h2 className="font-semibold">Location</h2>
            <p className="mt-3 text-sm">{complaint.address}</p>
            <p className="text-xs text-muted-foreground">{complaint.latitude}, {complaint.longitude}</p>
            <div className="mt-3">
              <LocationMap latitude={complaint.latitude} longitude={complaint.longitude} readOnly />
            </div>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-blue-800 hover:underline"
            >
              View on OpenStreetMap <ExternalLink className="size-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </section>

          {photos.length > 0 && (
            <section className="rounded-xl border bg-background p-5">
              <h2 className="font-semibold">Photos</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {photos.map((img) => (
                  <li key={img.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt={`Photo for complaint ${complaint.ticketNumber}`} loading="lazy" className="w-full rounded-lg border" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {evidence.length > 0 && (
            <section className="rounded-xl border border-green-200 bg-green-50/50 p-5">
              <h2 className="font-semibold">Resolution Evidence</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {evidence.map((img) => (
                  <li key={img.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="Resolution evidence" loading="lazy" className="w-full rounded-lg border" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <FeedbackSection complaintId={complaint.id} status={complaint.status} feedback={complaint.feedback} />
        </div>

        <div className="space-y-6">
          <AiAnalysisCard analysis={complaint.aiAnalysis} />
          <section className="rounded-xl border bg-background p-5">
            <h2 className="mb-4 font-semibold">Status Timeline</h2>
            <StatusTimeline current={complaint.status} history={complaint.statusHistory} />
          </section>
        </div>
      </div>
    </div>
  );
}
