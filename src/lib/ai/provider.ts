import "server-only";
import { GeminiProvider } from "./providers/gemini";
import { MockProvider } from "./providers/mock";
import type { AIProvider } from "./types";

// Free-tier friendly default. Change with GEMINI_MODEL (model names and quotas change often).
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

/** The only place that knows which AI vendor is used. */
export function getAIProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();

  if (name === "mock") return new MockProvider();

  if (name === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    return new GeminiProvider(
      key,
      process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      process.env.GEMINI_EMBEDDING_MODEL || undefined, // defaults to gemini-embedding-001
    );
  }

  throw new Error(`Unknown AI_PROVIDER "${name}"`);
}
