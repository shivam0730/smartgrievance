import { notFound } from "next/navigation";
import { requireOfficer } from "@/lib/auth/current-user";
import { getOfficerComplaintById } from "@/lib/data/officer";
import { ComplaintInfo } from "@/components/officer/complaint-detail/complaint-info";
import { ComplaintImages } from "@/components/officer/complaint-detail/complaint-images";
import { ComplaintLocation } from "@/components/officer/complaint-detail/complaint-location";
import { AIAnalysisPanel } from "@/components/officer/complaint-detail/ai-analysis-panel";
import { StatusTimeline } from "@/components/officer/complaint-detail/status-timeline";
import { SimilarComplaints } from "@/components/officer/complaint-detail/similar-complaints";
import { ActionPanel } from "@/components/officer/complaint-detail/action-panel";

export const metadata = { title: "Complaint | Officer | SmartGrievance" };

export default async function OfficerComplaintDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const user = await requireOfficer();
    const { id } = await params;
    const { prisma } = await import("@/lib/db");
    const departments = await prisma.department.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
    const complaint = await getOfficerComplaintById(
        id,
        user.id,
        user.departmentId,
    );

    if (!complaint) notFound();

    // Build similar items from both sides of the relation
    const similar: Parameters<typeof SimilarComplaints>[0]["items"] = [];
    const similarityIds: Record<string, string> = {};

    for (const s of complaint.similarityAsA) {
        similar.push({
            id: s.id,
            overallScore: s.overallScore,
            distanceMeters: s.distanceMeters,
            isConfirmedDuplicate: s.isConfirmedDuplicate,
            other: s.complaintB,
        });
        similarityIds[s.complaintB.id] = s.id;
    }
    for (const s of complaint.similarityAsB) {
        similar.push({
            id: s.id,
            overallScore: s.overallScore,
            distanceMeters: s.distanceMeters,
            isConfirmedDuplicate: s.isConfirmedDuplicate,
            other: s.complaintA,
        });
        similarityIds[s.complaintA.id] = s.id;
    }
    similar.sort((a, b) => b.overallScore - a.overallScore);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <ComplaintInfo complaint={complaint} />
                    <ComplaintImages images={complaint.images} />
                    <ComplaintLocation
                        latitude={complaint.latitude}
                        longitude={complaint.longitude}
                        address={complaint.address}
                    />
                    <AIAnalysisPanel analysis={complaint.aiAnalysis} />
                    <StatusTimeline history={complaint.statusHistory} />
                </div>

                <div className="space-y-4">
                    <ActionPanel
                        complaintId={complaint.id}
                        status={complaint.status}
                        currentCategory={complaint.category}
                        currentPriority={complaint.priority}
                        currentDepartmentId={complaint.departmentId}
                        departments={departments}
                    />
                    <SimilarComplaints items={similar} similarityIds={similarityIds} />
                </div>
            </div>
        </div>
    );
}