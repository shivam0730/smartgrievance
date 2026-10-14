"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewSuspicionAction } from "@/lib/officer/actions";
import { ReviewStatusBadge } from "@/components/officer/review-status-badge";
import type { HumanReviewStatus } from "@/generated/prisma/client";

export function SuspiciousReviewPanel({
  complaintId,
  currentStatus,
  reviewedByName,
  reviewedAt,
}: {
  complaintId: string;
  currentStatus: HumanReviewStatus;
  reviewedByName: string | null;
  reviewedAt: Date | null;
}) {
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  const decide = (decision: "CLEARED" | "CONFIRMED") => {
    start(async () => {
      const res = await reviewSuspicionAction(
        complaintId,
        decision,
        notes.trim() || undefined,
      );
      if (res.ok) {
        toast.success(
          decision === "CLEARED"
            ? "Marked as cleared"
            : "Marked as confirmed suspicious",
        );
        setNotes("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Current:</span>
        <ReviewStatusBadge status={currentStatus} />
        {reviewedByName && reviewedAt && (
          <span className="text-xs text-muted-foreground">
            by {reviewedByName} on{" "}
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(reviewedAt)}
          </span>
        )}
      </div>

      {currentStatus === "PENDING" && (
        <>
          <div>
            <label className="text-sm font-medium" htmlFor="review-notes">
              Review notes (optional)
            </label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Explain your decision"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => decide("CLEARED")}
              disabled={pending}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {pending ? "Saving..." : "Clear as genuine"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => decide("CONFIRMED")}
              disabled={pending}
            >
              {pending ? "Saving..." : "Confirm suspicious"}
            </Button>
          </div>
        </>
      )}

      {currentStatus !== "PENDING" && (
        <p className="text-xs text-muted-foreground">
          This review was already decided. Decisions cannot be re-opened from
          here.
        </p>
      )}
    </div>
  );
}