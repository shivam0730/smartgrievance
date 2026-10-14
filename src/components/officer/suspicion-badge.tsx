import { Badge } from "@/components/ui/badge";
import { suspicionLevel } from "@/lib/format";

export function SuspicionBadge({ score }: { score: number }) {
  const level = suspicionLevel(score);
  const cls =
    level === "High"
      ? "bg-red-100 text-red-800"
      : level === "Medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-800";
  return (
    <Badge className={cls}>
      {score}/100 · {level}
    </Badge>
  );
}