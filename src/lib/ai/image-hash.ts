import sharp from "sharp";

/** Photos whose fingerprints differ by this many bits or fewer are treated as the same photo. */
export const SAME_PHOTO_MAX_DISTANCE = 6;

/**
 * 64-bit "difference hash". It compares neighbouring pixels of a tiny grey version of the photo,
 * so the same picture still gets (almost) the same hash after resizing or re-compression.
 * Returns 16 hex characters, or null if the image cannot be decoded.
 */
export async function perceptualHash(buffer: Buffer): Promise<string | null> {
  try {
    const px = await sharp(buffer)
      .flatten({ background: "#ffffff" })
      .greyscale()
      .resize(9, 8, { fit: "fill" })
      .raw()
      .toBuffer();
    if (px.length !== 72) return null;
    let hex = "";
    let nibble = 0;
    let n = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        nibble = (nibble << 1) | (px[y * 9 + x] > px[y * 9 + x + 1] ? 1 : 0);
        if (++n === 4) {
          hex += nibble.toString(16);
          nibble = 0;
          n = 0;
        }
      }
    }
    return hex;
  } catch {
    return null;
  }
}

const BITS_IN_NIBBLE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/** Number of differing bits between two 16-character hex fingerprints (64 = completely different). */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== 16 || b.length !== 16) return 64;
  let distance = 0;
  for (let i = 0; i < 16; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    if (Number.isNaN(x)) return 64;
    distance += BITS_IN_NIBBLE[x];
  }
  return distance;
}

/** 0 bits apart = 1.0, 6 bits = 0.75, 24+ bits = 0 */
export const imageSimilarityFromDistance = (d: number) => Math.min(1, Math.max(0, 1 - d / 24));
