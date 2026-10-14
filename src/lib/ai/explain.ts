import type { Category, Priority } from "@/generated/prisma/client";
import { CATEGORY_LABEL, PRIORITY_LABEL } from "@/lib/format";

/**
 * Plain-language explanation shown to citizens and officers.
 * It never includes fraud or suspicion details; those stay in the officer-only signals.
 */
export function buildReasoning(args: {
  category: Category;
  confidence: number;
  priority: Priority;
  priorityReasons: string[];
  modelNote: string;
  photoObservations: string[];
  departmentName: string | null;
}): string {
  const lines = [
    `Category: ${CATEGORY_LABEL[args.category]} (${Math.round(args.confidence * 100)}% confidence)`,
    `Priority: ${PRIORITY_LABEL[args.priority]}`,
    "",
    "Reasons:",
    ...args.priorityReasons.map((r) => `• ${r}`),
  ];
  if (args.modelNote) lines.push(`• ${args.modelNote}`);
  for (const o of args.photoObservations) lines.push(`• Photo: ${o}`);
  if (args.departmentName) lines.push("", `Recommended department: ${args.departmentName}`);
  return lines.join("\n");
}
