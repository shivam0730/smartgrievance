"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveComplaintAction } from "@/lib/officer/actions";

type EvidenceItem = {
  imageUrl: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
};

async function uploadOne(file: File): Promise<EvidenceItem> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads?purpose=resolution", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Upload failed (${res.status})`);
  }
  const j = (await res.json()) as EvidenceItem & { proof: string };
  return {
    imageUrl: j.imageUrl,
    storageKey: j.storageKey,
    fileName: j.fileName,
    mimeType: j.mimeType,
    sizeBytes: j.sizeBytes,
  };
}

export function ResolveDialog({ complaintId }: { complaintId: string }) {
  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, start] = useTransition();

  const run = () => {
    if (remarks.trim().length < 10) {
      toast.error("Please write at least 10 characters of remarks.");
      return;
    }
    start(async () => {
      // 1) Upload evidence (if any)
      const evidence: EvidenceItem[] = [];
      for (const f of files) {
        try {
          evidence.push(await uploadOne(f));
        } catch (e) {
          toast.error((e as Error).message);
          return;
        }
      }

      // 2) Submit resolution
      const res = await resolveComplaintAction(complaintId, {
        remarks: remarks.trim(),
        evidenceUrls: evidence,
      });

      if (res.ok) {
        toast.success("Complaint resolved");
        setOpen(false);
        setRemarks("");
        setFiles([]);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-10 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800">
        Resolve with evidence
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve complaint</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium" htmlFor="resolve-remarks">
              Resolution remarks (required)
            </label>
            <Textarea
              id="resolve-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="What was done to fix the issue?"
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="evidence">
              Evidence photos (optional, max 5)
            </label>
            <input
              id="evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) =>
                setFiles(Array.from(e.target.files ?? []).slice(0, 5))
              }
              className="mt-1 block w-full text-sm"
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {files.length} file{files.length === 1 ? "" : "s"} selected
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={run} disabled={pending}>
            {pending ? "Resolving..." : "Confirm resolution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}