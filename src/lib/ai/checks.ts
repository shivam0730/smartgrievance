import "server-only";
import type { Category } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { STORE_THRESHOLD } from "./duplicate-scoring";
import {
  findDuplicateCandidates,
  findReusedImages,
  saveSimilarities,
  storeEmbedding,
  type DuplicateCandidate,
  type ImageFingerprint,
} from "./duplicates";
import { complaintEmbeddingText, embedTexts } from "./embeddings";
import { computeSuspicion, type ReusedImage, type SuspicionReason } from "./suspicion";
import type { AIProvider } from "./types";

export type ChecksResult = {
  duplicateScore: number;
  similarNearby: number;
  candidates: DuplicateCandidate[];
  reusedImages: ReusedImage[];
  suspicionScore: number;
  suspicionReasons: SuspicionReason[];
  /** Which checks could not run (they never block the analysis) */
  failures: string[];
};

/** Duplicate search + suspicion scoring. Each part is allowed to fail on its own. */
export async function runDuplicateAndSuspicionChecks(args: {
  provider: AIProvider;
  complaint: { id: string; userId: string; title: string; description: string; latitude: number; longitude: number };
  category: Category;
  fingerprints: ImageFingerprint[];
  isGenuineReport: boolean;
  textImageMismatch: boolean;
  mismatchReasons: string[];
}): Promise<ChecksResult> {
  const { provider, complaint } = args;
  const failures: string[] = [];
  let candidates: DuplicateCandidate[] = [];
  let reusedImages: ReusedImage[] = [];
  let complaintsLast24h = 0;

  try {
    const [vector] = await embedTexts(provider, [complaintEmbeddingText(complaint)]);
    await storeEmbedding(complaint.id, vector, provider.embeddingModel);
    candidates = await findDuplicateCandidates({
      complaintId: complaint.id,
      category: args.category,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      vector,
      images: args.fingerprints,
    });
    await saveSimilarities(complaint.id, candidates);
  } catch (e) {
    console.error("[ai] duplicate search failed:", e);
    failures.push("duplicate_search");
  }

  try {
    reusedImages = await findReusedImages({
      complaintId: complaint.id,
      userId: complaint.userId,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      images: args.fingerprints,
    });
  } catch (e) {
    console.error("[ai] image reuse check failed:", e);
    failures.push("image_reuse");
  }

  try {
    complaintsLast24h = await prisma.complaint.count({
      where: { userId: complaint.userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    });
  } catch (e) {
    console.error("[ai] submission count failed:", e);
    failures.push("submission_count");
  }

  const suspicion = computeSuspicion({
    isGenuineReport: args.isGenuineReport,
    textImageMismatch: args.textImageMismatch,
    mismatchReasons: args.mismatchReasons,
    reusedImages,
    repeatsBySameUser: candidates.filter((c) => c.userId === complaint.userId && c.overallScore >= 0.85),
    complaintsLast24h,
    latitude: complaint.latitude,
    longitude: complaint.longitude,
  });

  return {
    duplicateScore: candidates[0]?.overallScore ?? 0,
    similarNearby: candidates.filter((c) => c.overallScore >= STORE_THRESHOLD).length,
    candidates,
    reusedImages,
    suspicionScore: suspicion.score,
    suspicionReasons: suspicion.reasons,
    failures,
  };
}
