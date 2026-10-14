import "server-only";
import { Prisma, type Category } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  DUPLICATE_RADIUS_M,
  STORE_THRESHOLD,
  boundingBox,
  categorySimilarity,
  combineScores,
  haversineMeters,
  locationSimilarity,
} from "./duplicate-scoring";
import { toVectorLiteral } from "./embeddings";
import type { ReusedImage } from "./suspicion";

export type ImageFingerprint = { sha: string | null; ph: string | null };

export type DuplicateCandidate = {
  complaintId: string;
  ticketNumber: string;
  userId: string;
  title: string;
  distanceMeters: number;
  textSimilarity: number;
  locationSimilarity: number;
  imageSimilarity: number | null;
  categorySimilarity: number;
  overallScore: number;
};

const DAY_MS = 86_400_000;

export async function storeEmbedding(complaintId: string, vector: number[], model: string) {
  const literal = toVectorLiteral(vector);
  await prisma.$executeRaw`
    INSERT INTO "ComplaintEmbedding" ("complaintId", "embedding", "model")
    VALUES (${complaintId}, ${literal}::vector, ${model})
    ON CONFLICT ("complaintId")
    DO UPDATE SET "embedding" = EXCLUDED."embedding", "model" = EXCLUDED."model", "createdAt" = CURRENT_TIMESTAMP`;
}

type CandidateRow = {
  id: string;
  ticketNumber: string;
  title: string;
  category: Category;
  userId: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  textSimilarity: number;
};

/**
 * Finds complaints that may describe the same problem:
 * same small area (database filter), closest meaning first (pgvector), then scored on every signal.
 */
export async function findDuplicateCandidates(args: {
  complaintId: string;
  category: Category;
  latitude: number;
  longitude: number;
  vector: number[];
  images: ImageFingerprint[];
  now?: Date;
}): Promise<DuplicateCandidate[]> {
  const now = args.now ?? new Date();
  const box = boundingBox(args.latitude, args.longitude, DUPLICATE_RADIUS_M * 1.2);
  const literal = toVectorLiteral(args.vector);
  const since = new Date(now.getTime() - 90 * DAY_MS);
  const resolvedSince = new Date(now.getTime() - 14 * DAY_MS);

  const rows = await prisma.$queryRaw<CandidateRow[]>`
    SELECT c.id, c."ticketNumber", c.title, c.category, c."userId", c.latitude, c.longitude, c."createdAt",
           (1 - (e."embedding" <=> ${literal}::vector))::float8 AS "textSimilarity"
    FROM "ComplaintEmbedding" e
    JOIN "Complaint" c ON c.id = e."complaintId"
    WHERE c.id <> ${args.complaintId}
      AND c.status NOT IN ('CANCELLED', 'REJECTED')
      AND (c.status <> 'RESOLVED' OR c."resolvedAt" > ${resolvedSince})
      AND c.latitude BETWEEN ${box.minLat} AND ${box.maxLat}
      AND c.longitude BETWEEN ${box.minLng} AND ${box.maxLng}
      AND c."createdAt" > ${since}
    ORDER BY e."embedding" <=> ${literal}::vector
    LIMIT 10`;
  if (rows.length === 0) return [];

  const theirImages = await prisma.complaintImage.findMany({
    where: { complaintId: { in: rows.map((r) => r.id) }, kind: "COMPLAINT" },
    select: { complaintId: true, imageHash: true },
  });

  const out: DuplicateCandidate[] = [];
  for (const r of rows) {
    const distance = haversineMeters(
      { lat: args.latitude, lng: args.longitude },
      { lat: r.latitude, lng: r.longitude },
    );
    if (distance > DUPLICATE_RADIUS_M) continue; // corner of the box, not really close

    // best photo match between the two complaints (null if either side has no usable photo)
    let image: number | null = null;
    for (const mine of args.images) {
      for (const theirs of theirImages.filter((t) => t.complaintId === r.id)) {
        let sim: number | null = null;
        if (mine.sha && theirs.imageHash && mine.sha === theirs.imageHash) sim = 1;
        // perceptual-hash similarity disabled until the schema field is added
        if (sim !== null) image = Math.max(image ?? 0, sim);
      }
    }

    const text = Math.min(1, Math.max(0, r.textSimilarity));
    const loc = locationSimilarity(distance);
    const cat = categorySimilarity(args.category, r.category);
    const ageDays = (now.getTime() - r.createdAt.getTime()) / DAY_MS;
    out.push({
      complaintId: r.id,
      ticketNumber: r.ticketNumber,
      userId: r.userId,
      title: r.title,
      distanceMeters: Math.round(distance),
      textSimilarity: round2(text),
      locationSimilarity: round2(loc),
      imageSimilarity: image === null ? null : round2(image),
      categorySimilarity: cat,
      overallScore: round2(combineScores({ text, location: loc, image, category: cat, ageDays })),
    });
  }
  return out.sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
}

type ReusedRow = {
  complaintId: string;
  ticketNumber: string;
  userId: string;
  latitude: number;
  longitude: number;
  imageHash: string | null;
};

/** Same or look-alike photos used in OTHER complaints, anywhere (not only nearby). */
export async function findReusedImages(args: {
  complaintId: string;
  userId: string;
  latitude: number;
  longitude: number;
  images: ImageFingerprint[];
}): Promise<ReusedImage[]> {
  const found = new Map<string, ReusedImage>();

  for (const fp of args.images) {
    if (!fp.sha && !fp.ph) continue;
    const shaCond = fp.sha ? Prisma.sql`ci."imageHash" = ${fp.sha}` : Prisma.sql`FALSE`;

    const rows = await prisma.$queryRaw<ReusedRow[]>(Prisma.sql`
      SELECT ci."complaintId" AS "complaintId", c."ticketNumber" AS "ticketNumber", c."userId" AS "userId",
             c.latitude, c.longitude, ci."imageHash" AS "imageHash"
      FROM "ComplaintImage" ci
      JOIN "Complaint" c ON c.id = ci."complaintId"
      WHERE ci."complaintId" <> ${args.complaintId}
        AND ci.kind = 'COMPLAINT'
        AND c.status <> 'CANCELLED'
        AND (${shaCond})
      LIMIT 20`);

    for (const r of rows) {
      found.set(r.complaintId, {
        complaintId: r.complaintId,
        ticketNumber: r.ticketNumber,
        sameUser: r.userId === args.userId,
        distanceMeters: haversineMeters({ lat: args.latitude, lng: args.longitude }, { lat: r.latitude, lng: r.longitude }),
        exact: Boolean(fp.sha && r.imageHash === fp.sha),
      });
    }
  }
  return [...found.values()];
}

/** Saves similar pairs for officers to review. Never touches a human's earlier decision. */
export async function saveSimilarities(complaintId: string, candidates: DuplicateCandidate[]) {
  for (const c of candidates) {
    if (c.overallScore < STORE_THRESHOLD) continue;
    const [a, b] = [complaintId, c.complaintId].sort();
    const scores = {
      textSimilarity: c.textSimilarity,
      imageSimilarity: c.imageSimilarity,
      locationSimilarity: c.locationSimilarity,
      distanceMeters: c.distanceMeters,
      overallScore: c.overallScore,
    };
    await prisma.complaintSimilarity.upsert({
      where: { complaintAId_complaintBId: { complaintAId: a, complaintBId: b } },
      create: { complaintAId: a, complaintBId: b, ...scores },
      update: scores, // isConfirmedDuplicate is left as the officer set it
    });
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;