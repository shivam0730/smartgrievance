import Link from "next/link";
import { requireOfficer } from "@/lib/auth/current-user";
import { listDuplicatePairs } from "@/lib/data/officer";
import { duplicatesListQuerySchema } from "@/lib/validations/officer";
import { DuplicatesFilters } from "@/components/officer/duplicates-filters";
import { DuplicatesTable } from "@/components/officer/duplicates-table";

export const metadata = { title: "Duplicate Review | Officer | SmartGrievance" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function OfficerDuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireOfficer();
  const sp = await searchParams;

  const parsed = duplicatesListQuerySchema.safeParse({
    minScore: first(sp.minScore) || undefined,
    confirmed: first(sp.confirmed) || undefined,
    page: first(sp.page) || undefined,
  });
  const query = parsed.success
    ? parsed.data
    : duplicatesListQuerySchema.parse({});

  const { items, total, totalPages } = await listDuplicatePairs(
    user.id,
    user.departmentId,
    query,
  );

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    params.set("minScore", String(query.minScore));
    params.set("confirmed", query.confirmed);
    params.set("page", String(n));
    return `/officer/duplicates?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Duplicate review</h1>
        <p className="text-sm text-muted-foreground">
          Complaints that look like possible duplicates. Decide whether to
          merge them or keep them separate.
        </p>
      </div>

      <DuplicatesFilters query={query} />

      <DuplicatesTable items={items} />

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {total} pair{total === 1 ? "" : "s"} · Page {query.page} of {totalPages}
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