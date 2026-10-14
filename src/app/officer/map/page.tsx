import { requireOfficer } from "@/lib/auth/current-user";
import { listOfficerComplaintsForMap } from "@/lib/data/officer";
import { OfficerMap } from "@/components/officer/officer-map";

export const metadata = { title: "Complaint Map | Officer | SmartGrievance" };

export default async function OfficerMapPage() {
  const user = await requireOfficer();
  const pins = await listOfficerComplaintsForMap(user.id, user.departmentId, {
    scope: "assigned",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Complaint map</h1>
        <p className="text-sm text-muted-foreground">
          Geographic view of complaints assigned to you. Hover a marker for
          details.
        </p>
      </div>
      <OfficerMap pins={pins} />
    </div>
  );
}