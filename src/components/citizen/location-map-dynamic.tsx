"use client";

import dynamic from "next/dynamic";

// Leaflet needs the browser (window), so it must never render on the server
export const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-lg bg-muted" aria-label="Loading map" />,
});
