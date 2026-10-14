"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/officer/priority-badge";
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/format";
import type {
  Category,
  ComplaintStatus,
  Priority,
} from "@/generated/prisma/client";

type MapPin = {
  id: string;
  ticketNumber: string;
  title: string;
  category: Category;
  priority: Priority;
  status: ComplaintStatus;
  latitude: number;
  longitude: number;
  address: string;
};

const PRIORITY_COLOR: Record<Priority, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#dc2626",
};

/**
 * Lightweight map view: renders markers over a static OpenStreetMap tile.
 * No extra dependencies. For interactive pan/zoom, swap in your citizen map component.
 */
export function OfficerMap({ pins }: { pins: MapPin[] }) {
  const [hovered, setHovered] = useState<MapPin | null>(null);
  const [priority, setPriority] = useState<Priority | "ALL">("ALL");
  const [category, setCategory] = useState<Category | "ALL">("ALL");

  const filtered = useMemo(
    () =>
      pins.filter(
        (p) =>
          (priority === "ALL" || p.priority === priority) &&
          (category === "ALL" || p.category === category),
      ),
    [pins, priority, category],
  );

  // Compute bounds
  const bounds = useMemo(() => {
    if (filtered.length === 0)
      return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
    const lats = filtered.map((p) => p.latitude);
    const lngs = filtered.map((p) => p.longitude);
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [filtered]);

  const pad = 0.02;
  const centerLat = (bounds.minLat + bounds.maxLat) / 2 || 28.6139;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2 || 77.209;
  const bbox = `${bounds.minLng - pad},${bounds.minLat - pad},${bounds.maxLng + pad},${bounds.maxLat + pad}`;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="map-priority" className="text-xs font-medium text-muted-foreground">
            Priority
          </label>
          <select
            id="map-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority | "ALL")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="map-cat" className="text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            id="map-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "ALL")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ALL">All categories</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {pins.length} shown
        </p>
      </div>

      {/* Map */}
      <div className="relative h-[500px] w-full overflow-hidden rounded-md border bg-muted">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No complaints to show on the map
          </div>
        ) : (
          <iframe
            title="Officer complaint map"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`}
            className="h-full w-full"
          />
        )}

        {/* Markers overlay */}
        {filtered.length > 0 && (
          <div className="pointer-events-none absolute inset-0">
            {filtered.map((p) => {
              // approximate position within bbox
              const latRange = bounds.maxLat - bounds.minLat || 0.01;
              const lngRange = bounds.maxLng - bounds.minLng || 0.01;
              const x = ((p.longitude - bounds.minLng) / lngRange) * 100;
              const y = 100 - ((p.latitude - bounds.minLat) / latRange) * 100;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: 16,
                    height: 16,
                    background: PRIORITY_COLOR[p.priority],
                  }}
                  onMouseEnter={() => setHovered(p)}
                  onMouseLeave={() => setHovered(null)}
                  aria-label={p.ticketNumber}
                />
              );
            })}
          </div>
        )}

        {/* Hover popup */}
        {hovered && (
          <div className="absolute bottom-3 left-3 right-3 rounded-md border bg-background/95 p-3 shadow-lg backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {hovered.ticketNumber}
              </span>
              <PriorityBadge priority={hovered.priority} />
              <Badge variant="secondary">{STATUS_LABEL[hovered.status]}</Badge>
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-medium">{hovered.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {CATEGORY_LABEL[hovered.category]} · {hovered.address}
            </p>
            <Link
              href={`/officer/complaints/${hovered.id}`}
              className="mt-1 inline-block text-xs text-blue-700 hover:underline"
            >
              Open complaint
            </Link>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-medium">Legend:</span>
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
          <span key={p} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: PRIORITY_COLOR[p] }}
            />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}