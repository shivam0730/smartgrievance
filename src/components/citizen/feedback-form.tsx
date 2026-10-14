"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OUTCOME_VALUES } from "@/lib/validations/feedback";

const OUTCOME_TEXT = {
  YES: "Yes, it was resolved",
  PARTIALLY: "Partially resolved",
  NO: "No, it was not resolved",
} as const;

export function FeedbackForm({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [outcome, setOutcome] = useState<(typeof OUTCOME_VALUES)[number] | "">("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) return setError("Please select a rating from 1 to 5 stars.");
    if (!outcome) return setError("Please tell us whether your issue was resolved.");

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId, rating, outcome, comment: comment.trim() || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <fieldset>
        <legend className="text-sm font-medium">Rate the resolution</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <Star
                aria-hidden="true"
                className={`size-8 rounded peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-800 ${
                  n <= rating ? "fill-amber-400 text-amber-500" : "text-slate-300"
                }`}
              />
              <span className="sr-only">
                {n} star{n > 1 ? "s" : ""}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">Was your issue resolved?</legend>
        <div className="mt-2 space-y-2">
          {OUTCOME_VALUES.map((v) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="outcome"
                value={v}
                checked={outcome === v}
                onChange={() => setOutcome(v)}
                className="size-4 accent-blue-800"
              />
              {OUTCOME_TEXT[v]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          rows={3}
          maxLength={1000}
          className="mt-1.5"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="bg-blue-800 text-white hover:bg-blue-900">
        {loading ? "Submitting..." : "Submit feedback"}
      </Button>
    </form>
  );
}
