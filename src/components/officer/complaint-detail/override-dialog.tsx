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
import { overrideAnalysisAction } from "@/lib/officer/actions";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
} from "@/lib/format";
import {
  Category,
  Priority,
} from "@/generated/prisma/client";

const CATEGORIES = Object.values(Category);
const PRIORITIES = Object.values(Priority);

export function OverrideDialog({
  complaintId,
  departments,
  currentCategory,
  currentPriority,
  currentDepartmentId,
}: {
  complaintId: string;
  departments: { id: string; name: string }[];
  currentCategory: string;
  currentPriority: string;
  currentDepartmentId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(currentCategory);
  const [priority, setPriority] = useState(currentPriority);
  const [departmentId, setDepartmentId] = useState(currentDepartmentId ?? "");
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  const run = () => {
    if (reason.trim().length < 5) {
      toast.error("Please give a short reason (min 5 characters).");
      return;
    }
    start(async () => {
      const res = await overrideAnalysisAction(complaintId, {
        category,
        priority,
        departmentId: departmentId || undefined,
        reason: reason.trim(),
      });
      if (res.ok) {
        toast.success("Override saved");
        setOpen(false);
        setReason("");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
        Override AI analysis
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override AI recommendation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium" htmlFor="ov-cat">
              Category
            </label>
            <select
              id="ov-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ov-pri">
              Priority
            </label>
            <select
              id="ov-pri"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ov-dept">
              Department
            </label>
            <select
              id="ov-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Keep current —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="ov-reason">
              Reason for override (required)
            </label>
            <Textarea
              id="ov-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={run} disabled={pending}>
            {pending ? "Saving..." : "Save override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}