import "server-only";
import { EMBEDDING_DIMENSIONS } from "./constants";
import type { AIProvider } from "./types";

const BATCH_SIZE = 50;

export function l2Normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  return norm === 0 ? v : v.map((x) => x / norm);
}

/** Embeds texts in batches, checks the size and normalises (needed for sizes below the model's maximum). */
export async function embedTexts(provider: AIProvider, texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const vectors = await provider.embed(texts.slice(i, i + BATCH_SIZE));
    for (const v of vectors) {
      if (v.length !== EMBEDDING_DIMENSIONS || v.some((x) => !Number.isFinite(x))) {
        throw new Error(`Embedding has ${v.length} dimensions, expected ${EMBEDDING_DIMENSIONS}`);
      }
      out.push(l2Normalize(v));
    }
  }
  return out;
}

export const toVectorLiteral = (v: number[]) => `[${v.join(",")}]`;

export const complaintEmbeddingText = (c: { title: string; description: string }) =>
  `${c.title}\n${c.description}`.slice(0, 2000);
