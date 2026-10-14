import type { Priority, Severity } from "@/generated/prisma/client";

const ORDER: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const score = (s: Severity) => ORDER.indexOf(s) + 1; // 1..4
const SENSITIVE_PLACE =
  /\b(school|college|hospital|clinic|highway|main road|junction|crossing|market|temple|mosque|church|gurudwara|bus stand|railway station)\b/i;

export type PriorityInput = {
  textSeverity: Severity;
  visionSeverity?: Severity | null;
  hazard: boolean;
  description: string;
  /** Number of similar complaints nearby (filled in by the duplicate step later) */
  similarNearby?: number;
};

/**
 * Priority is calculated by plain, testable rules (not by the AI directly).
 * The AI supplies severity and hazard; this function turns them into a priority and lists the reasons.
 */
export function computePriority(input: PriorityInput): { priority: Priority; severity: Severity; reasons: string[] } {
  const reasons: string[] = [];
  const severity = ORDER[Math.max(score(input.textSeverity), input.visionSeverity ? score(input.visionSeverity) : 1) - 1];
  let s = score(severity);
  reasons.push(`Issue severity assessed as ${severity.toLowerCase()}`);

  if (input.hazard && s < 4) {
    s += 1;
    reasons.push("Possible immediate danger to people was flagged");
  } else if (input.hazard) {
    reasons.push("Possible immediate danger to people was flagged");
  }
  if (s >= 2 && s < 4 && SENSITIVE_PLACE.test(input.description)) {
    s += 1;
    reasons.push("Location mentioned is a busy or sensitive place");
  }
  const nearby = input.similarNearby ?? 0;
  if (nearby >= 3 && s < 4) {
    s += 1;
    reasons.push(`${nearby} similar complaints exist nearby`);
  }
  return { priority: ORDER[s - 1] as Priority, severity, reasons };
}
