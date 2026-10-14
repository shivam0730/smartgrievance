import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { EMBEDDING_DIMENSIONS } from "../constants";
import type { AIProvider, GenerateJsonOptions } from "../types";

function toJsonSchema(schema: z.ZodType): unknown {
  const js = z.toJSONSchema(schema) as Record<string, unknown>;
  delete js.$schema; // the Gemini API does not accept this key
  return js;
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private ai: GoogleGenAI;

  constructor(
    apiKey: string,
    readonly model: string,
    readonly embeddingModel: string = "gemini-embedding-001",
    baseUrl?: string, // only used by tests
  ) {
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 30_000,
        retryOptions: { attempts: 3, initialDelay: 1, maxDelay: 8 }, // retries 429 / 5xx
        ...(baseUrl ? { baseUrl } : {}),
      },
    });
  }

  async generateJson<T>({ system, prompt, images = [], schema }: GenerateJsonOptions<T>): Promise<T> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, ...images.map((i) => ({ inlineData: { mimeType: i.mimeType, data: i.data } }))],
        },
      ],
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: toJsonSchema(schema),
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty response (possibly blocked by safety filters)");
    return schema.parse(JSON.parse(text)); // validates the model output, never trusts it blindly
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.ai.models.embedContent({
      model: this.embeddingModel,
      contents: texts,
      config: { taskType: "SEMANTIC_SIMILARITY", outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    const vectors = (response.embeddings ?? []).map((e) => e.values ?? []);
    if (vectors.length !== texts.length) {
      throw new Error(`Embedding API returned ${vectors.length} vectors for ${texts.length} texts`);
    }
    return vectors;
  }
}
