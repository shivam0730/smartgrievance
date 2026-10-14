import type { Category } from "@/generated/prisma/client";
import type { Classification, VisionResult } from "./schemas";

export const CATEGORY_TO_DEPARTMENT: Record<Category, string | null> = {
  POTHOLE: "Road Department",
  ROAD_DAMAGE: "Road Department",
  GARBAGE: "Sanitation Department",
  DRAINAGE: "Drainage Department",
  WATER_LEAKAGE: "Water Department",
  STREETLIGHT: "Electrical Department",
  ELECTRICITY: "Electrical Department",
  OTHER: null, // needs a human to decide
};

export const MIN_CONFIDENCE_TO_APPLY = 0.7;

const RELATED: [Category, Category][] = [
  ["POTHOLE", "ROAD_DAMAGE"],
  ["STREETLIGHT", "ELECTRICITY"],
  ["DRAINAGE", "WATER_LEAKAGE"],
];
export const categoriesRelated = (a: string, b: string) => a === b || RELATED.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export type CategoryDecision = {
  category: Category;
  confidence: number;
  textImageMismatch: boolean;
  mismatchReasons: string[];
};

/** Combines the text result and (optional) photo result into one category decision. */
export function decideCategory(text: Classification, vision: VisionResult | null): CategoryDecision {
  let category: Category = text.category;
  let confidence = text.confidence;
  const mismatchReasons: string[] = [];

  if (vision) {
    const detected = vision.detectedIssue;
    if (detected !== "NONE" && categoriesRelated(detected, text.category)) {
      confidence = Math.min(1, Math.max(confidence, vision.confidence) + 0.03); // text and photo agree
    } else if (text.confidence < 0.5 && detected !== "NONE" && vision.confidence >= MIN_CONFIDENCE_TO_APPLY) {
      category = detected; // text was vague, photo is clear
      confidence = vision.confidence;
    }
    if (!vision.isCivicIssuePhoto) mismatchReasons.push("Photo does not show a civic issue");
    else if (detected !== "NONE" && !categoriesRelated(detected, text.category) && vision.confidence >= MIN_CONFIDENCE_TO_APPLY) {
      mismatchReasons.push(`Photo looks like ${detected.toLowerCase()} but description says ${text.category.toLowerCase()}`);
    } else if (!vision.matchesDescription) mismatchReasons.push("Photo does not appear to match the description");
  }
  return { category, confidence, textImageMismatch: mismatchReasons.length > 0, mismatchReasons };
}

/** Which category is stored on the complaint: the AI one if it is confident, otherwise the citizen's own. */
export function finalCategory(citizenCategory: Category, decision: CategoryDecision): Category {
  return decision.confidence >= MIN_CONFIDENCE_TO_APPLY ? decision.category : citizenCategory;
}

/** Officer with the fewest open complaints; ties go to the first officer (stable by id). */
export function pickLeastLoaded(officers: { id: string }[], openCounts: Record<string, number>): string | null {
  if (officers.length === 0) return null;
  const sorted = [...officers].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.reduce((best, o) => ((openCounts[o.id] ?? 0) < (openCounts[best.id] ?? 0) ? o : best)).id;
}
