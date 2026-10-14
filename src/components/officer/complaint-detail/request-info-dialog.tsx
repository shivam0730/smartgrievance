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
import { requestInfoAction } from "@/lib/officer/actions";

export function RequestInfoDialog({ complaintId }: { complaintId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const run = () => {
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters.");
      return;
    }
    start(async () => {
      const res = await requestInfoAction(complaintId, {
        message: message.trim(),
      });
      if (res.ok) {
        toast.success("Citizen notified");
        setOpen(false);
        setMessage("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
        Request information
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request more information</DialogTitle>
        </DialogHeader>
        <div>
          <label className="text-sm font-medium" htmlFor="info-msg">
            Message to citizen
          </label>
          <Textarea
            id="info-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What additional detail do you need?"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={run} disabled={pending}>
            {pending ? "Sending..." : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}