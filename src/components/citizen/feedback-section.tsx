import { Star } from "lucide-react";
import type { ComplaintStatus, ResolutionOutcome } from "@/generated/prisma/client";
import { formatDate } from "@/lib/format";
import { FeedbackForm } from "./feedback-form";

const OUTCOME_TEXT: Record<ResolutionOutcome, string> = {
  YES: "Resolved",
  PARTIALLY: "Partially resolved",
  NO: "Not resolved",
};

type Feedback = { rating: number; outcome: ResolutionOutcome; comment: string | null; createdAt: Date };

export function FeedbackSection({
  complaintId,
  status,
  feedback,
}: {
  complaintId: string;
  status: ComplaintStatus;
  feedback: Feedback | null;
}) {
  if (feedback) {
    return (
      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">Your Feedback</h2>
        <div className="mt-3 flex items-center gap-1" role="img" aria-label={`${feedback.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              aria-hidden="true"
              className={`size-5 ${n <= feedback.rating ? "fill-amber-400 text-amber-500" : "text-slate-300"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-sm">
          Outcome: <strong>{OUTCOME_TEXT[feedback.outcome]}</strong>
        </p>
        {feedback.comment && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{feedback.comment}</p>}
        <p className="mt-3 text-xs text-muted-foreground">Submitted on {formatDate(feedback.createdAt)}</p>
      </section>
    );
  }

  if (status !== "RESOLVED") return null;

  return (
    <section className="rounded-xl border bg-background p-5">
      <h2 className="mb-4 font-semibold">How did we do?</h2>
      <FeedbackForm complaintId={complaintId} />
    </section>
  );
}
