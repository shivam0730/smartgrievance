import type { Category, ComplaintStatus, Priority } from "@/generated/prisma/client";
import type { HumanReviewStatus } from "@/generated/prisma/client";

const APP_TIMEZONE = "Asia/Kolkata";

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  SUBMITTED: "Submitted",
  AI_ANALYSIS: "AI Analysis",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  NEEDS_INFORMATION: "Needs Information",
  DUPLICATE: "Duplicate",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  POTHOLE: "Pothole",
  GARBAGE: "Garbage",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlight",
  WATER_LEAKAGE: "Water Leakage",
  ROAD_DAMAGE: "Road Damage",
  ELECTRICITY: "Electricity",
  OTHER: "Other",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: APP_TIMEZONE }).format(d);
}

export function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: APP_TIMEZONE }).format(d);
}

/** Plan thresholds: 0-30 Low, 31-60 Medium, 61+ High (81+ is "critical review" for officers) */
export function suspicionLevel(score: number): "Low" | "Medium" | "High" {
  if (score <= 30) return "Low";
  if (score <= 60) return "Medium";
  return "High";
}

export const REVIEW_STATUS_LABEL: Record<HumanReviewStatus, string> = {
  NOT_REQUIRED: "Not Required",
  PENDING: "Pending Review",
  CLEARED: "Cleared",
  CONFIRMED: "Confirmed Suspicious",
};

export function formatRelative(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function formatDistance(meters: number | null | undefined) {
  if (meters == null) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatPercent(ratio: number | null | undefined, digits = 0) {
  if (ratio == null) return "—";
  return `${(ratio * 100).toFixed(digits)}%`;
}