import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/officer/status-badge";
import { StatusActions } from "./status-actions";
import { ResolveDialog } from "./resolve-dialog";
import { RequestInfoDialog } from "./request-info-dialog";
import { RejectDialog } from "./reject-dialog";
import { OverrideDialog } from "./override-dialog";
import type { Category, ComplaintStatus, Priority } from "@/generated/prisma/client";

export function ActionPanel({
  complaintId,
  status,
  currentCategory,
  currentPriority,
  currentDepartmentId,
  departments,
}: {
  complaintId: string;
  status: ComplaintStatus;
  currentCategory: Category;
  currentPriority: Priority;
  currentDepartmentId: string | null;
  departments: { id: string; name: string }[];
}) {
  const isClosed = ["RESOLVED", "REJECTED", "CANCELLED", "DUPLICATE"].includes(
    status,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Actions</span>
          <StatusBadge status={status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isClosed ? (
          <p className="text-sm text-muted-foreground">
            This complaint is closed. No further action is possible.
          </p>
        ) : (
          <>
            <StatusActions complaintId={complaintId} currentStatus={status} />
            {status !== "RESOLVED" && <ResolveDialog complaintId={complaintId} />}
            {(status === "ASSIGNED" ||
              status === "IN_PROGRESS" ||
              status === "AI_ANALYSIS" ||
              status === "SUBMITTED") && (
              <RequestInfoDialog complaintId={complaintId} />
            )}
            <OverrideDialog
              complaintId={complaintId}
              departments={departments}
              currentCategory={currentCategory}
              currentPriority={currentPriority}
              currentDepartmentId={currentDepartmentId}
            />
            <RejectDialog complaintId={complaintId} />
          </>
        )}
      </CardContent>
    </Card>
  );
}