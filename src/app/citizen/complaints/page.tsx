import Link from "next/link";
import { ComplaintTable } from "@/components/citizen/complaint-table";
import { requireRole } from "@/lib/auth/current-user";
import { listCitizenComplaints } from "@/lib/data/complaints";
import { STATUS_LABEL } from "@/lib/format";
import { STATUS_VALUES, listQuerySchema } from "@/lib/validations/complaint";

export const metadata = { title: "My Complaints | SmartGrievance" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function CitizenComplaintsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireRole(["CITIZEN"]);
  const sp = await searchParams;

  const parsed = listQuerySchema.safeParse({ status: first(sp.status), q: first(sp.q), page: first(sp.page) });
  const query = parsed.success ? parsed.data : { page: 1 };
  const { items, total, totalPages } = await listCitizenComplaints(user.id, query);

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.q) params.set("q", query.q);
    params.set("page", String(p));
    return `/citizen/complaints?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Complaints</h1>
        <Link
          href="/citizen/complaints/new"
          className="inline-flex h-10 items-center rounded-md bg-blue-800 px-4 text-sm font-medium text-white hover:bg-blue-900"
        >
          Report New Issue
        </Link>
      </div>

      {/* Plain GET form: filters work without any client JavaScript */}
      <form method="get" className="flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="q">Search by ID or title</label>
        <input
          id="q"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search by ID or title"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64"
        />
        <label className="sr-only" htmlFor="status">Filter by status</label>
        <select
          id="status"
          name="status"
          defaultValue={query.status ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted">
          Apply
        </button>
      </form>

      <ComplaintTable items={items} />

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {total} complaint{total === 1 ? "" : "s"} · Page {query.page} of {totalPages}
        </p>
        <div className="flex gap-2">
          {query.page > 1 && (
            <Link href={pageHref(query.page - 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">
              Previous
            </Link>
          )}
          {query.page < totalPages && (
            <Link href={pageHref(query.page + 1)} className="rounded-md border px-3 py-1.5 hover:bg-muted">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
