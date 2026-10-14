import { z } from "zod";
import { CATEGORY_VALUES } from "@/lib/validations/complaint";

export const SEVERITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

// NOTE: kept deliberately plain (no min/max on strings) because the schema is sent to the AI vendor.
// Values are clamped and cleaned in code after parsing.
export const classificationSchema = z.object({
  category: z.enum(CATEGORY_VALUES),
  confidence: z.number(),
  severity: z.enum(SEVERITY_VALUES),
  hazard: z.boolean(),
  isGenuineReport: z.boolean(),
  reasoning: z.string(),
});
export type Classification = z.infer<typeof classificationSchema>;

export const visionSchema = z.object({
  isCivicIssuePhoto: z.boolean(),
  detectedIssue: z.enum([...CATEGORY_VALUES, "NONE"]),
  confidence: z.number(),
  severity: z.enum(SEVERITY_VALUES),
  hazard: z.boolean(),
  matchesDescription: z.boolean(),
  observations: z.array(z.string()),
});
export type VisionResult = z.infer<typeof visionSchema>;

export const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
export const clip = (s: string, max: number) => s.trim().slice(0, max);
