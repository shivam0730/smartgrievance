import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/officer/priority-badge";
import {
  CATEGORY_LABEL,
  PRIORITY_LABEL,
  REVIEW_STATUS_LABEL,
  formatDateTime,
  formatPercent,
  suspicionLevel,
} from "@/lib/format";
import type {
  Category,
  Priority,
  Severity,
  HumanReviewStatus,
} from "@/generated/prisma/client";

type Props = {
  analysis: {
    status: "PENDING" | "COMPLETED" | "FAILED";
    category: Category | null;
    categoryConfidence: number | null;
    severity: Severity | null;
    priority: Priority | null;
    duplicateScore: number;
    suspicionScore: number;
    suspicionReasons: unknown;
    reviewStatus: HumanReviewStatus;
    reviewedAt: Date | null;
    reviewedBy: { id: string; name: string } | null;
    recommendedDepartment: { id: string; name: string } | null;
    reasoning: string | null;
    // signals: unknown;
    model: string | null;
    errorMessage: string | null;
    updatedAt: Date;
  } | null;
};

export function AIAnalysisPanel({ analysis }: Props) {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No AI analysis has been generated yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const level = suspicionLevel(analysis.suspicionScore);
  const reasons = Array.isArray(analysis.suspicionReasons)
    ? (analysis.suspicionReasons as string[])
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>AI Analysis</span>
          {analysis.model && (
            <span className="text-xs font-normal text-muted-foreground">
              {analysis.model}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis.status === "FAILED" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            AI analysis failed: {analysis.errorMessage ?? "unknown error"}
          </div>
        )}

        {/* Classification */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Category</p>
            <p className="mt-0.5">
              {analysis.category ? CATEGORY_LABEL[analysis.category] : "—"}
              {analysis.categoryConfidence != null && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatPercent(analysis.categoryConfidence)}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Severity</p>
            <p className="mt-0.5">{analysis.severity ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Suggested priority</p>
            <div className="mt-0.5">
              {analysis.priority ? (
                <PriorityBadge priority={analysis.priority} />
              ) : (
                "—"
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Recommended department
            </p>
            <p className="mt-0.5">
              {analysis.recommendedDepartment?.name ?? "—"}
            </p>
          </div>
        </div>

        {/* Suspicion */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Suspicion score
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge
              className={
                analysis.suspicionScore >= 60
                  ? "bg-red-100 text-red-800"
                  : analysis.suspicionScore >= 31
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
              }
            >
              {analysis.suspicionScore}/100 · {level}
            </Badge>
            <Badge variant="secondary">
              {REVIEW_STATUS_LABEL[analysis.reviewStatus]}
            </Badge>
            {analysis.reviewedBy && analysis.reviewedAt && (
              <span className="text-xs text-muted-foreground">
                by {analysis.reviewedBy.name} on {formatDateTime(analysis.reviewedAt)}
              </span>
            )}
          </div>

          {reasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Duplicate score */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Duplicate score
          </p>
          <p className="mt-0.5 text-sm">
            {formatPercent(analysis.duplicateScore)}{" "}
            <span className="text-muted-foreground">
              (higher = more likely a duplicate)
            </span>
          </p>
        </div>

        {/* Reasoning */}
        {analysis.reasoning && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Reasoning</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{analysis.reasoning}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Last updated {formatDateTime(analysis.updatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}