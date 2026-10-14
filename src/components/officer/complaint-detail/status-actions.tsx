"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { updateStatusAction } from "@/lib/officer/actions";
import type { ComplaintStatus } from "@/generated/prisma/client";
import { STATUS_LABEL } from "@/lib/format";

const FLOW: Record<ComplaintStatus, ComplaintStatus[]> = {
  SUBMITTED: ["ASSIGNED"],
  AI_ANALYSIS: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  NEEDS_INFORMATION: ["IN_PROGRESS"],
  RESOLVED: [],
  DUPLICATE: [],
  REJECTED: [],
  CANCELLED: [],
};

export function StatusActions({
  complaintId,
  currentStatus,
}: {
  complaintId: string;
  currentStatus: ComplaintStatus;
}) {
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<ComplaintStatus | null>(null);
  const [remarks, setRemarks] = useState("");
  const [pending, start] = useTransition();

  const options = FLOW[currentStatus];
  if (options.length === 0) return null;

  const run = () => {
    if (!next) return;
    start(async () => {
      const res = await updateStatusAction(complaintId, {
        newStatus: next,
        remarks: remarks.trim() || undefined,
      });
      if (res.ok) {
        toast.success(`Moved to ${STATUS_LABEL[next]}`);
        setOpen(false);
        setRemarks("");
        setNext(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      {options.map((s) => (
        <Dialog
          key={s}
          open={open && next === s}
          onOpenChange={(v) => {
            setOpen(v);
            if (v) setNext(s);
          }}
        >
          <DialogTrigger className="inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-800 px-4 text-sm font-medium text-white hover:bg-blue-900">
            Move to {STATUS_LABEL[s]}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move to {STATUS_LABEL[s]}?</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="remarks">
                Remarks (optional)
              </label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add a note about this status change"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={run} disabled={pending}>
                {pending ? "Updating..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}