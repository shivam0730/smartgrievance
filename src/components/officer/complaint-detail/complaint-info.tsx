import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/officer/priority-badge";
import { StatusBadge } from "@/components/officer/status-badge";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/format";

type Props = {
  complaint: {
    ticketNumber: string;
    title: string;
    description: string;
    category: keyof typeof CATEGORY_LABEL;
    status: Parameters<typeof StatusBadge>[0]["status"];
    priority: Parameters<typeof PriorityBadge>[0]["priority"];
    address: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt: Date | null;
    user: { id: string; name: string; email: string };
    department: { id: string; name: string } | null;
    assignedOfficer: { id: string; name: string } | null;
  };
};

export function ComplaintInfo({ complaint }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Complaint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-mono text-muted-foreground">
            {complaint.ticketNumber}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{complaint.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="text-xs text-muted-foreground">
              {CATEGORY_LABEL[complaint.category]}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Description
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {complaint.description}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Location</p>
          <p className="mt-1 text-sm">{complaint.address}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Citizen</p>
            <p className="mt-0.5">{complaint.user.name}</p>
            <p className="text-xs text-muted-foreground">{complaint.user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Department</p>
            <p className="mt-0.5">
              {complaint.department?.name ?? "— Not assigned —"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Officer</p>
            <p className="mt-0.5">
              {complaint.assignedOfficer?.name ?? "— Not assigned —"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Submitted</p>
            <p className="mt-0.5">{formatDateTime(complaint.createdAt)}</p>
          </div>
          {complaint.resolvedAt && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Resolved
              </p>
              <p className="mt-0.5">{formatDateTime(complaint.resolvedAt)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}