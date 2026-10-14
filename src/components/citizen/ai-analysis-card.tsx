import { Sparkles } from "lucide-react";
import type { Category, Priority, Severity } from "@/generated/prisma/client";
import { CATEGORY_LABEL, PRIORITY_LABEL, suspicionLevel } from "@/lib/format";

type Analysis = {
  status: "PENDING" | "COMPLETED" | "FAILED";
  category: Category | null;
  categoryConfidence: number | null;
  severity: Severity | null;
  priority: Priority | null;
  duplicateScore: number;
  suspicionScore: number;
  reasoning: string | null;
  recommendedDepartment: { name: string } | null;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function AiAnalysisCard({ analysis }: { analysis: Analysis | null }) {
  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-indigo-900">
        <Sparkles className="size-4" aria-hidden="true" /> AI Analysis
      </h2>

      {analysis?.status === "COMPLETED" ? (
        <>
          <dl className="mt-4 space-y-2">
            {analysis.category && (
              <Row
                label="Detected category"
                value={`${CATEGORY_LABEL[analysis.category]}${
                  analysis.categoryConfidence != null ? ` (${Math.round(analysis.categoryConfidence * 100)}%)` : ""
                }`}
              />
            )}
            {analysis.severity && <Row label="Severity" value={PRIORITY_LABEL[analysis.severity]} />}
            {analysis.priority && <Row label="Priority" value={PRIORITY_LABEL[analysis.priority]} />}
            <Row
              label="Possible duplicate"
              value={analysis.duplicateScore >= 0.8 ? "Possible match found" : "No strong match found"}
            />
            <Row label="Suspicion" value={suspicionLevel(analysis.suspicionScore)} />
            {analysis.recommendedDepartment && <Row label="Recommended department" value={analysis.recommendedDepartment.name} />}
          </dl>
          {analysis.reasoning && <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{analysis.reasoning}</p>}
          <p className="mt-4 text-xs text-muted-foreground">
            AI gives recommendations only. A human officer makes the final decision.
          </p>
        </>
      ) : analysis?.status === "FAILED" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          AI analysis is temporarily unavailable. Your complaint has been submitted successfully and will be reviewed manually.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">AI analysis is pending.</p>
      )}
    </section>
  );
}
