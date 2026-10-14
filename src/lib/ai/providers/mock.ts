import { EMBEDDING_DIMENSIONS } from "../constants";
import type { AIProvider, GenerateJsonOptions } from "../types";
import type { Classification, VisionResult } from "../schemas";

const KEYWORDS: [Classification["category"], RegExp][] = [
  ["POTHOLE", /pothole|pit in (the )?road/i],
  ["STREETLIGHT", /street ?light|lamp ?post|light (is )?(off|not working)/i],
  ["ELECTRICITY", /electric|transformer|live wire|wires?|power cut|sparking/i],
  ["WATER_LEAKAGE", /water.*(leak|pipe)|pipe.*(leak|burst)|leaking/i],
  ["DRAINAGE", /drain|sewer|sewage|waterlogg|manhole/i],
  ["GARBAGE", /garbage|waste|trash|dustbin|litter|dump/i],
  ["ROAD_DAMAGE", /road.*(broken|damage|crack|sunk)|broken road/i],
];

function looksLikeGibberish(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const bad = words.filter((w) => w.length >= 5 && !/[aeiou]/i.test(w)).length;
  return bad / words.length > 0.5;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Word-overlap "embedding" (hashing trick). Not truly semantic, but enough for offline tests. */
export function hashEmbedding(text: string): number[] {
  const v = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const grams = [...words, ...words.slice(1).map((w, i) => `${words[i]} ${w}`)];
  for (const g of grams) {
    const h = fnv1a(g);
    v[h % EMBEDDING_DIMENSIONS] += (h >>> 16) & 1 ? 1 : -1;
  }
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  return v.map((x) => x / norm);
}

/** Offline provider for local testing: simple keyword rules, no network, no API key. */
export class MockProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "mock-keywords";
  readonly embeddingModel = "mock-hash-768";

  async generateJson<T>({ task, prompt, schema }: GenerateJsonOptions<T>): Promise<T> {
    if (task === "classify") {
      const hit = KEYWORDS.find(([, re]) => re.test(prompt));
      const hazard = /live wire|sparking|open manhole|electric shock|school|accident/i.test(prompt);
      const out: Classification = {
        category: hit?.[0] ?? "OTHER",
        confidence: hit ? 0.88 : 0.4,
        severity: hazard ? "HIGH" : "MEDIUM",
        hazard,
        isGenuineReport: !looksLikeGibberish(prompt.replace(/^Title: |\nDescription: /g, " ")),
        reasoning: hit ? `Description mentions ${hit[0].toLowerCase().replace("_", " ")} keywords.` : "No clear category keywords found.",
      };
      return schema.parse(out);
    }
    const out: VisionResult = {
      isCivicIssuePhoto: true,
      detectedIssue: "NONE",
      confidence: 0.5,
      severity: "MEDIUM",
      hazard: false,
      matchesDescription: true,
      observations: ["Mock provider does not inspect images."],
    };
    return schema.parse(out);
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(hashEmbedding);
  }
}
