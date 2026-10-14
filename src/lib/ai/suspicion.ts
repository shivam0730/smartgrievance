// Suspicion is a REVIEW SIGNAL, never an accusation: nothing here rejects a complaint or labels a citizen.

// Rough bounding box of India; positions outside it are unusual for this service
export const SERVICE_AREA = { minLat: 6, maxLat: 37.5, minLng: 68, maxLng: 98 };

export type ReusedImage = {
  complaintId: string;
  ticketNumber: string;
  sameUser: boolean;
  distanceMeters: number;
  exact: boolean;
};

export type SuspicionInput = {
  isGenuineReport: boolean;
  textImageMismatch: boolean;
  mismatchReasons: string[];
  reusedImages: ReusedImage[];
  /** Earlier complaints from the SAME citizen that are almost identical to this one */
  repeatsBySameUser: { ticketNumber: string; overallScore: number }[];
  complaintsLast24h: number;
  latitude: number;
  longitude: number;
};

export type SuspicionReason = { code: string; points: number; text: string };

export function suspicionLevelLabel(score: number): "Low" | "Medium" | "High" | "Critical review" {
  if (score <= 30) return "Low";
  if (score <= 60) return "Medium";
  if (score <= 80) return "High";
  return "Critical review";
}

export function computeSuspicion(i: SuspicionInput): { score: number; level: string; reasons: SuspicionReason[] } {
  const reasons: SuspicionReason[] = [];

  if (!i.isGenuineReport) {
    reasons.push({ code: "NOT_GENUINE", points: 30, text: "The description looks like a test message, spam or unrelated text" });
  }
  if (i.textImageMismatch) {
    reasons.push({ code: "TEXT_IMAGE_MISMATCH", points: 25, text: i.mismatchReasons[0] ?? "The photo may not match the description" });
  }

  if (i.reusedImages.length > 0) {
    const far = i.reusedImages.find((r) => r.distanceMeters > 1000);
    if (far) {
      reasons.push({
        code: "IMAGE_REUSED_ELSEWHERE",
        points: 45,
        text: `The same photo was already used in complaint ${far.ticketNumber}, about ${(far.distanceMeters / 1000).toFixed(1)} km away`,
      });
    } else {
      const same = i.reusedImages.find((r) => r.sameUser);
      const r = same ?? i.reusedImages[0];
      reasons.push({
        code: same ? "IMAGE_REUSED_BY_SAME_USER" : "IMAGE_REUSED_BY_OTHER_USER",
        points: same ? 30 : 20,
        text: same
          ? `The same photo was already used in this citizen's complaint ${r.ticketNumber}`
          : `The photo is identical to one in complaint ${r.ticketNumber} from another citizen`,
      });
    }
  }

  if (i.repeatsBySameUser.length > 0) {
    reasons.push({
      code: "REPEAT_BY_SAME_USER",
      points: 20,
      text: `Very similar to the same citizen's earlier complaint ${i.repeatsBySameUser[0].ticketNumber}`,
    });
  }

  if (i.complaintsLast24h >= 10) {
    reasons.push({ code: "SUBMISSION_BURST", points: 25, text: `${i.complaintsLast24h} complaints from one account in 24 hours` });
  } else if (i.complaintsLast24h >= 5) {
    reasons.push({ code: "SUBMISSION_BURST", points: 15, text: `${i.complaintsLast24h} complaints from one account in 24 hours` });
  }

  const a = SERVICE_AREA;
  if (i.latitude < a.minLat || i.latitude > a.maxLat || i.longitude < a.minLng || i.longitude > a.maxLng) {
    reasons.push({ code: "OUTSIDE_SERVICE_AREA", points: 20, text: "The location is outside the expected service area" });
  }

  const score = Math.min(100, reasons.reduce((n, r) => n + r.points, 0));
  return { score, level: suspicionLevelLabel(score), reasons };
}
