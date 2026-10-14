import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/format";
import {
  Category,
  ComplaintStatus,
  Priority,
} from "@/generated/prisma/client";
import type { OfficerListQuery } from "@/lib/validations/officer";

const STATUS_VALUES = Object.values(ComplaintStatus);
const CATEGORY_VALUES = Object.values(Category);
const PRIORITY_VALUES = Object.values(Priority);

export function ComplaintsFilters({ query }: { query: OfficerListQuery }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      {/* Search */}
      <div className="flex flex-col">
        <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Ticket, title, or address"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-64"
        />
      </div>

      {/* Scope */}
      <div className="flex flex-col">
        <label htmlFor="scope" className="text-xs font-medium text-muted-foreground">
          Scope
        </label>
        <select
          id="scope"
          name="scope"
          defaultValue={query.scope}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="assigned">Assigned to me</option>
          <option value="department">My department</option>
          <option value="all">All complaints</option>
        </select>
      </div>

      {/* Status */}
      <div className="flex flex-col">
        <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={query.status ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All</option>
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="flex flex-col">
        <label htmlFor="category" className="text-xs font-medium text-muted-foreground">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={query.category ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All</option>
          {CATEGORY_VALUES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="flex flex-col">
        <label htmlFor="priority" className="text-xs font-medium text-muted-foreground">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue={query.priority ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All</option>
          {PRIORITY_VALUES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
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