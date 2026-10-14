import type { SuspiciousListQuery } from "@/lib/validations/officer";

export function SuspiciousFilters({ query }: { query: SuspiciousListQuery }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label htmlFor="minScore" className="text-xs font-medium text-muted-foreground">
          Minimum suspicion score
        </label>
        <select
          id="minScore"
          name="minScore"
          defaultValue={String(query.minScore)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="0">Any (0+)</option>
          <option value="31">Medium+ (31+)</option>
          <option value="40">Elevated (40+)</option>
          <option value="61">High (61+)</option>
          <option value="81">Critical (81+)</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="reviewStatus" className="text-xs font-medium text-muted-foreground">
          Review status
        </label>
        <select
          id="reviewStatus"
          name="reviewStatus"
          defaultValue={query.reviewStatus}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="PENDING">Pending review</option>
          <option value="CLEARED">Cleared</option>
          <option value="CONFIRMED">Confirmed suspicious</option>
          <option value="ALL">All</option>
        </select>
      </div>

      <button
        type="submit"
        className="h-10 rounded-md bg-blue-800 px-4 text-sm font-medium text-white hover:bg-blue-900"
      >
        Apply
      </button>
    </form>
  );
}