import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // stays under the 4.5 MB serverless body limit

export function uploadFolder(userId: string) {
  return `smartgrievance/complaints/${userId}`;
}

/** Detects the real image type from the first bytes (the browser-sent type is never trusted). */
export function detectImageMime(b: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

type UploadMeta = {
  imageUrl: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  imageHash: string;
};

function secret() {
  const s = process.env.CLOUDINARY_API_SECRET;
  if (!s) throw new Error("CLOUDINARY_API_SECRET is missing");
  return s;
}

/** HMAC over the upload details + owner. Proves "our server accepted this file for this user". */
export function signUpload(userId: string, m: UploadMeta) {
  return createHmac("sha256", secret())
    .update(JSON.stringify([userId, m.imageUrl, m.storageKey, m.fileName, m.mimeType, m.sizeBytes, m.imageHash]))
    .digest("hex");
}

export function verifyUpload(userId: string, m: UploadMeta & { proof: string }) {
  if (!m.storageKey.startsWith(`${uploadFolder(userId)}/`)) return false;
  const expected = Buffer.from(signUpload(userId, m), "hex");
  const given = Buffer.from(m.proof, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Officer resolution evidence folder. */
export function resolutionFolder(userId: string) {
  return `smartgrievance/resolutions/${userId}`;
}