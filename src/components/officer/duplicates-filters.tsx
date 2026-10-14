import type { DuplicatesListQuery } from "@/lib/validations/officer";

export function DuplicatesFilters({ query }: { query: DuplicatesListQuery }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col">
        <label htmlFor="minScore" className="text-xs font-medium text-muted-foreground">
          Minimum similarity
        </label>
        <select
          id="minScore"
          name="minScore"
          defaultValue={String(query.minScore)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="0.4">40% match</option>
          <option value="0.6">60% match</option>
          <option value="0.75">75% match</option>
          <option value="0.9">90% match (high confidence)</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="confirmed" className="text-xs font-medium text-muted-foreground">
          Review state
        </label>
        <select
          id="confirmed"
          name="confirmed"
          defaultValue={query.confirmed}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="PENDING">Pending review</option>
          <option value="YES">Confirmed duplicates</option>
          <option value="NO">Marked separate</option>
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