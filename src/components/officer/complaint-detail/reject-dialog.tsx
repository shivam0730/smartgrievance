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
import { rejectComplaintAction } from "@/lib/officer/actions";

export function RejectDialog({ complaintId }: { complaintId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  const run = () => {
    if (reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters.");
      return;
    }
    start(async () => {
      const res = await rejectComplaintAction(complaintId, {
        reason: reason.trim(),
      });
      if (res.ok) {
        toast.success("Complaint rejected");
        setOpen(false);
        setReason("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-red-700 hover:bg-muted">
        Reject complaint
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject complaint</DialogTitle>
        </DialogHeader>
        <div>
          <label className="text-sm font-medium" htmlFor="reject-reason">
            Reason (shown to citizen)
          </label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={run}
            disabled={pending}
          >
            {pending ? "Rejecting..." : "Confirm rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}