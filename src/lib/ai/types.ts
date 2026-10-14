import type { z } from "zod";

export type ImageInput = { mimeType: string; data: string }; // data = base64

export type GenerateJsonOptions<T> = {
  /** Short task name, used for logging (and by the mock provider) */
  task: "classify" | "vision";
  system: string;
  prompt: string;
  images?: ImageInput[];
  schema: z.ZodType<T>;
};

/**
 * Everything the app needs from an AI vendor.
 * To switch vendors, write a new adapter in providers/ and register it in provider.ts.
 */
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  readonly embeddingModel: string;
  generateJson<T>(opts: GenerateJsonOptions<T>): Promise<T>;
  /** One vector per input text, in the same order. */
  embed(texts: string[]): Promise<number[][]>;
}
