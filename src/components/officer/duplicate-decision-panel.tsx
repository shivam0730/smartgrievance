"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveDuplicatePairAction } from "@/lib/officer/actions";

export function DuplicateDecisionPanel({
  similarityId,
  complaintAId,
  complaintBId,
  complaintATicket,
  complaintBTicket,
  currentDecision,
}: {
  similarityId: string;
  complaintAId: string;
  complaintBId: string;
  complaintATicket: string;
  complaintBTicket: string;
  currentDecision: boolean | null;
}) {
  const [primary, setPrimary] = useState<"A" | "B">("A");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();

  const run = (decision: "MERGE" | "KEEP_SEPARATE") => {
    start(async () => {
      const primaryId = decision === "MERGE" ? (primary === "A" ? complaintAId : complaintBId) : null;
      const res = await resolveDuplicatePairAction(
        similarityId,
        decision,
        primaryId,
        notes.trim() || undefined,
      );
      if (res.ok) {
        toast.success(decision === "MERGE" ? "Merged as duplicate" : "Kept separate");
        setNotes("");
      } else {
        toast.error(res.error);
      }
    });
  };

  if (currentDecision !== null) {
    return (
      <div className="rounded-md border bg-muted/40 p-3">
        <p className="text-sm">
          {currentDecision === true
            ? "This pair has been confirmed as duplicates."
            : "This pair has been reviewed and marked as separate."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Which one is the primary complaint?</p>
        <p className="text-xs text-muted-foreground">
          The other will be marked as a duplicate of this one.
        </p>
        <div className="mt-2 space-y-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="primary"
              checked={primary === "A"}
              onChange={() => setPrimary("A")}
            />
            <span>
              <strong>A</strong> · {complaintATicket}
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="primary"
              checked={primary === "B"}
              onChange={() => setPrimary("B")}
            />
            <span>
              <strong>B</strong> · {complaintBTicket}
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="dup-notes">
          Notes (optional)
        </label>
        <Textarea
          id="dup-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Explain why you chose this decision"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => run("MERGE")}
          disabled={pending}
          className="bg-red-700 hover:bg-red-800"
        >
          {pending ? "Saving..." : "Merge as duplicate"}
        </Button>
        <Button
          variant="outline"
          onClick={() => run("KEEP_SEPARATE")}
          disabled={pending}
        >
          {pending ? "Saving..." : "Keep separate"}
        </Button>
      </div>
    </div>
  );
}