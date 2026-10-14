export const CATEGORIES = [
  "POTHOLE", "GARBAGE", "DRAINAGE", "STREETLIGHT",
  "WATER_LEAKAGE", "ROAD_DAMAGE", "ELECTRICITY", "OTHER",
] as const;

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const STATUSES = [
  "SUBMITTED", "AI_ANALYSIS", "ASSIGNED", "IN_PROGRESS", "RESOLVED",
  "NEEDS_INFORMATION", "DUPLICATE", "REJECTED", "CANCELLED",
] as const;

export const ROLES = ["CITIZEN", "OFFICER", "ADMIN"] as const;

export const CATEGORY_TO_DEPARTMENT: Record<string, string> = {
  POTHOLE: "Road Department",
  ROAD_DAMAGE: "Road Department",
  GARBAGE: "Sanitation Department",
  DRAINAGE: "Drainage Department",
  WATER_LEAKAGE: "Water Department",
  STREETLIGHT: "Electrical Department",
  ELECTRICITY: "Electrical Department",
};