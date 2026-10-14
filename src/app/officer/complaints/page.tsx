import Link from "next/link";
import { requireOfficer } from "@/lib/auth/current-user";
import { listOfficerComplaints } from "@/lib/data/officer";
import { officerListQuerySchema } from "@/lib/validations/officer";
import { ComplaintsFilters } from "@/components/officer/complaints-filters";
import { ComplaintsTable } from "@/components/officer/complaints-table";

export const metadata = { title: "Complaints | Officer | SmartGrievance" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function OfficerComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireOfficer();
  const sp = await searchParams;

  const parsed = officerListQuerySchema.safeParse({
    status: first(sp.status) || undefined,
    category: first(sp.category) || undefined,
    priority: first(sp.priority) || undefined,
    q: first(sp.q) || undefined,
    scope: first(sp.scope) || undefined,
    page: first(sp.page) || undefined,
  });

  const query = parsed.success ? parsed.data : officerListQuerySchema.parse({});
  const { items, total, totalPages } = await listOfficerComplaints(
    user.id,
    user.departmentId,
    query,
  );

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query.scope !== "assigned") params.set("scope", query.scope);
    if (query.status) params.set("status", query.status);
    if (query.category) params.set("category", query.category);
    if (query.priority) params.set("priority", query.priority);
    if (query.q) params.set("q", query.q);
    params.set("page", String(p));
    return `/officer/complaints?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          Manage complaints assigned to you or your department.
        </p>
      </div>

      <ComplaintsFilters query={query} />

      <ComplaintsTable items={items} />

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {total} complaint{total === 1 ? "" : "s"} · Page {query.page} of{" "}
          {totalPages}
        </p>
        <div className="flex gap-2">
          {query.page > 1 && (
            <Link
              href={pageHref(query.page - 1)}
              className="rounded-md border px-3 py-1.5 hover:bg-muted"
            >
              Previous
            </Link>
          )}
          {query.page < totalPages && (
            <Link
              href={pageHref(query.page + 1)}
              className="rounded-md border px-3 py-1.5 hover:bg-muted"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}