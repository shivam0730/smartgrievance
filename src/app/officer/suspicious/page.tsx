import Link from "next/link";
import { requireOfficer } from "@/lib/auth/current-user";
import { listSuspiciousComplaints } from "@/lib/data/officer";
import { suspiciousListQuerySchema } from "@/lib/validations/officer";
import { SuspiciousFilters } from "@/components/officer/suspicious-filters";
import { SuspiciousTable } from "@/components/officer/suspicious-table";

export const metadata = { title: "Suspicious Complaints | Officer | SmartGrievance" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function OfficerSuspiciousPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireOfficer();
  const sp = await searchParams;

  const parsed = suspiciousListQuerySchema.safeParse({
    minScore: first(sp.minScore) || undefined,
    reviewStatus: first(sp.reviewStatus) || undefined,
    page: first(sp.page) || undefined,
  });
  const query = parsed.success
    ? parsed.data
    : suspiciousListQuerySchema.parse({});

  const { items, total, totalPages } = await listSuspiciousComplaints(
    user.id,
    user.departmentId,
    query,
  );

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    params.set("minScore", String(query.minScore));
    params.set("reviewStatus", query.reviewStatus);
    params.set("page", String(p));
    return `/officer/suspicious?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suspicious complaints</h1>
        <p className="text-sm text-muted-foreground">
          AI-flagged complaints that need a human review decision. AI never
          rejects a complaint on its own.
        </p>
      </div>

      <SuspiciousFilters query={query} />

      <SuspiciousTable items={items} />

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {total} flag{total === 1 ? "" : "s"} · Page {query.page} of {totalPages}
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