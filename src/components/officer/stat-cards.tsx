import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

type Stat = {
  label: string;
  value: number;
  href: string;
  accent?: "default" | "critical" | "warning" | "success" | "info";
};

const ACCENT_CLASS: Record<NonNullable<Stat["accent"]>, string> = {
  default:  "text-foreground",
  critical: "text-red-700",
  warning:  "text-orange-700",
  success:  "text-emerald-700",
  info:     "text-blue-700",
};

export function OfficerStatCards({
  stats,
}: {
  stats: {
    assigned: number;
    pending: number;
    inProgress: number;
    critical: number;
    resolved: number;
    needsInfo: number;
    suspiciousPending: number;
    duplicatesPending: number;
  };
}) {
  const cards: Stat[] = [
    { label: "Assigned to me", value: stats.assigned, href: "/officer/complaints?scope=assigned", accent: "info" },
    { label: "Pending action", value: stats.pending, href: "/officer/complaints?status=ASSIGNED", accent: "warning" },
    { label: "In progress", value: stats.inProgress, href: "/officer/complaints?status=IN_PROGRESS", accent: "info" },
    { label: "Critical", value: stats.critical, href: "/officer/complaints?priority=CRITICAL", accent: "critical" },
    { label: "Needs info", value: stats.needsInfo, href: "/officer/complaints?status=NEEDS_INFORMATION", accent: "warning" },
    { label: "Suspicious pending", value: stats.suspiciousPending, href: "/officer/suspicious", accent: "critical" },
    { label: "Duplicates pending", value: stats.duplicatesPending, href: "/officer/duplicates", accent: "warning" },
    { label: "Resolved by me", value: stats.resolved, href: "/officer/complaints?status=RESOLVED&scope=assigned", accent: "success" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <Link key={c.label} href={c.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {c.label}
              </p>
              <p className={`mt-1 text-2xl font-bold ${ACCENT_CLASS[c.accent ?? "default"]}`}>
                {c.value}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}