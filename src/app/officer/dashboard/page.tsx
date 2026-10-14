import { requireOfficer } from "@/lib/auth/current-user";
import { getOfficerDashboardStats } from "@/lib/data/officer";
import { OfficerStatCards } from "@/components/officer/stat-cards";
import { CriticalCases } from "@/components/officer/critical-cases";
import { AIAlerts } from "@/components/officer/ai-alerts";
import { RecentAssignments } from "@/components/officer/recent-assignments";
import { DuplicateAlerts } from "@/components/officer/duplicate-alerts";

export const metadata = { title: "Officer Dashboard | SmartGrievance" };

export default async function OfficerDashboardPage() {
  const user = await requireOfficer();
  const stats = await getOfficerDashboardStats(user.id, user.departmentId);

  return (
    <div className="space-y-6">
      {/* Welcome strip */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          {user.departmentId
            ? "Here is what needs your attention today."
            : "You are not assigned to a department yet."}
        </p>
      </div>

      {/* KPI cards */}
      <OfficerStatCards stats={stats} />

      {/* Three-column dashboard body */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CriticalCases officerId={user.id} departmentId={user.departmentId} />
        <AIAlerts officerId={user.id} departmentId={user.departmentId} />
        <RecentAssignments officerId={user.id} />
        <DuplicateAlerts officerId={user.id} departmentId={user.departmentId} />
      </div>
    </div>
  );
}