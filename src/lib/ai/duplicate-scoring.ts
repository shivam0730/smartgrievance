import { categoriesRelated } from "./decision";

export const DUPLICATE_RADIUS_M = 300; // only complaints this close can be duplicates
export const FLAG_THRESHOLD = 0.8; // "potential duplicate" shown to officers
export const STORE_THRESHOLD = 0.6; // similarity rows saved for review

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 0 m = 1.0, falling to 0 at the radius */
export const locationSimilarity = (meters: number) => clamp01(1 - meters / DUPLICATE_RADIUS_M);

export function categorySimilarity(a: string, b: string): number {
  if (a === b) return 1;
  return categoriesRelated(a, b) ? 0.5 : 0;
}

/** Recent complaints count fully; very old ones count a little less (never below 0.8). */
export function timeFactor(ageDays: number): number {
  if (ageDays <= 7) return 1;
  return Math.max(0.8, 1 - ((ageDays - 7) / 83) * 0.2);
}

export const WEIGHTS_WITH_IMAGE = { text: 0.4, location: 0.25, image: 0.25, category: 0.1 };
export const WEIGHTS_NO_IMAGE = { text: 0.55, location: 0.3, category: 0.15 };

export function combineScores(i: {
  text: number;
  location: number;
  image: number | null; // null when one of the complaints has no usable photo
  category: number;
  ageDays: number;
}): number {
  const base =
    i.image === null
      ? WEIGHTS_NO_IMAGE.text * i.text + WEIGHTS_NO_IMAGE.location * i.location + WEIGHTS_NO_IMAGE.category * i.category
      : WEIGHTS_WITH_IMAGE.text * i.text +
        WEIGHTS_WITH_IMAGE.location * i.location +
        WEIGHTS_WITH_IMAGE.image * i.image +
        WEIGHTS_WITH_IMAGE.category * i.category;
  return clamp01(base * timeFactor(i.ageDays));
}

/** Rough lat/lng box around a point (used to narrow the database search before exact distances) */
export function boundingBox(lat: number, lng: number, radiusM: number) {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}
