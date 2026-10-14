import http from "node:http";
import sharp from "sharp";
import { boundingBox, categorySimilarity, combineScores, haversineMeters, locationSimilarity, timeFactor } from "../src/lib/ai/duplicate-scoring";
import { computeSuspicion } from "../src/lib/ai/suspicion";
import { hammingDistance, imageSimilarityFromDistance, perceptualHash } from "../src/lib/ai/image-hash";
import { hashEmbedding } from "../src/lib/ai/providers/mock";
import { embedTexts } from "../src/lib/ai/embeddings";
import { GeminiProvider } from "../src/lib/ai/providers/gemini";

let fails = 0;
const ok = (name: string, cond: boolean, extra = "") => { if (!cond) fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); };
const cos = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

(async () => {
  console.log("== scoring maths");
  const d = haversineMeters({ lat: 28.6139, lng: 77.209 }, { lat: 28.6149, lng: 77.209 });
  ok("0.001 degree latitude is about 111 m", Math.abs(d - 111) < 3, `(${d.toFixed(1)} m)`);
  ok("location similarity: 0 m=1, 150 m=0.5, 300 m=0, beyond=0", locationSimilarity(0) === 1 && locationSimilarity(150) === 0.5 && locationSimilarity(300) === 0 && locationSimilarity(900) === 0);
  ok("category: same=1, related=0.5, other=0", categorySimilarity("POTHOLE", "POTHOLE") === 1 && categorySimilarity("POTHOLE", "ROAD_DAMAGE") === 0.5 && categorySimilarity("POTHOLE", "GARBAGE") === 0);
  ok("time factor: 1 within a week, 0.8 floor", timeFactor(3) === 1 && Math.abs(timeFactor(90) - 0.8) < 1e-9 && timeFactor(300) === 0.8);
  const plan = combineScores({ text: 0.94, location: 0.97, image: 0.86, category: 1, ageDays: 1 });
  ok("plan example (text 94, image 86, location 97, same category) is a duplicate (>=0.8)", plan >= 0.8, `(${plan.toFixed(2)})`);
  ok("same text far away is NOT flagged", combineScores({ text: 1, location: 0, image: null, category: 1, ageDays: 1 }) < 0.8);
  const noImg = combineScores({ text: 1, location: 0.86, image: null, category: 1, ageDays: 1 });
  ok("identical text 42 m away, no photos -> flagged", noImg >= 0.8, `(${noImg.toFixed(2)})`);
  const box = boundingBox(28.6139, 77.209, 360);
  const p300 = { lat: 28.6139 + 300 / 111320, lng: 77.209 };
  ok("bounding box contains a point 300 m away", p300.lat < box.maxLat && p300.lat > box.minLat);

  console.log("== suspicion");
  const base = { isGenuineReport: true, textImageMismatch: false, mismatchReasons: [], reusedImages: [], repeatsBySameUser: [], complaintsLast24h: 1, latitude: 28.6, longitude: 77.2 };
  ok("clean complaint = 0", computeSuspicion(base).score === 0);
  ok("gibberish = 30 (Low band)", computeSuspicion({ ...base, isGenuineReport: false }).score === 30);
  const far = computeSuspicion({ ...base, reusedImages: [{ complaintId: "x", ticketNumber: "SG-1", sameUser: false, distanceMeters: 5200, exact: true }] });
  ok("photo reused 5 km away = 45 with readable reason", far.score === 45 && /5\.2 km/.test(far.reasons[0].text), far.reasons[0].text);
  const stack = computeSuspicion({ ...base, isGenuineReport: false, textImageMismatch: true, mismatchReasons: ["Photo does not show a civic issue"], reusedImages: [{ complaintId: "x", ticketNumber: "SG-1", sameUser: true, distanceMeters: 30, exact: true }] });
  ok("signals stack: 30 + 25 + 30 = 85 -> Critical review", stack.score === 85 && stack.level === "Critical review");
  ok("score never exceeds 100", computeSuspicion({ ...base, isGenuineReport: false, textImageMismatch: true, mismatchReasons: ["m"], reusedImages: [{ complaintId: "x", ticketNumber: "S", sameUser: false, distanceMeters: 9000, exact: true }], repeatsBySameUser: [{ ticketNumber: "S", overallScore: 0.9 }], complaintsLast24h: 12, latitude: 51, longitude: 0 }).score === 100);
  ok("burst: 5 in a day = 15, 10 = 25", computeSuspicion({ ...base, complaintsLast24h: 5 }).score === 15 && computeSuspicion({ ...base, complaintsLast24h: 10 }).score === 25);
  ok("location outside India = 20", computeSuspicion({ ...base, latitude: 51.5, longitude: -0.1 }).score === 20);
  ok("several people reporting the same issue is NOT suspicious", computeSuspicion({ ...base, repeatsBySameUser: [] }).score === 0);

  console.log("== hamming + REAL image fingerprints (sharp)");
  ok("hamming basics", hammingDistance("0000000000000000", "ffffffffffffffff") === 64 && hammingDistance("0000000000000000", "0000000000000001") === 1 && hammingDistance("abc", "abc") === 64);
  ok("similarity mapping", imageSimilarityFromDistance(0) === 1 && imageSimilarityFromDistance(6) === 0.75 && imageSimilarityFromDistance(40) === 0);
  const svgA = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#7a8"/><circle cx="260" cy="300" r="140" fill="#222"/><rect x="480" y="80" width="220" height="380" fill="#eee"/><polygon points="100,560 380,420 640,570" fill="#a33"/></svg>`;
  const svgB = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#334"/><rect x="40" y="40" width="300" height="120" fill="#fc3"/><circle cx="600" cy="420" r="120" fill="#eee"/><rect x="120" y="300" width="380" height="60" fill="#3a6"/></svg>`;
  const A = await sharp(Buffer.from(svgA)).jpeg({ quality: 90 }).toBuffer();
  const A_small = await sharp(A).resize(400, 300).jpeg({ quality: 40 }).toBuffer();        // shrunk + heavily compressed
  const A_bright = await sharp(A).modulate({ brightness: 1.15 }).png().toBuffer();          // brighter, different format
  const B = await sharp(Buffer.from(svgB)).jpeg({ quality: 90 }).toBuffer();
  const [hA, hAs, hAb, hB] = await Promise.all([A, A_small, A_bright, B].map(perceptualHash));
  console.log("   hashes:", hA, hAs, hAb, hB);
  ok("hash is 16 hex chars", /^[0-9a-f]{16}$/.test(hA!));
  ok("same photo resized+recompressed stays within the 'same photo' limit", hammingDistance(hA!, hAs!) <= 6, `(distance ${hammingDistance(hA!, hAs!)})`);
  ok("same photo, brighter, other format stays within limit", hammingDistance(hA!, hAb!) <= 6, `(distance ${hammingDistance(hA!, hAb!)})`);
  ok("a different photo is far away", hammingDistance(hA!, hB!) >= 15, `(distance ${hammingDistance(hA!, hB!)})`);
  ok("a PNG with transparency still hashes", (await perceptualHash(await sharp({ create: { width: 50, height: 50, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } } }).png().toBuffer())) !== null);
  ok("garbage bytes -> null, no crash", (await perceptualHash(Buffer.from("not an image"))) === null);

  console.log("== embeddings");
  const e1 = hashEmbedding("Deep pothole on the road near the market gate");
  const e2 = hashEmbedding("Big pothole on road near market gate, scooters slipping");
  const e3 = hashEmbedding("Garbage heap not collected near the park entrance for a week");
  ok("vectors have 768 dims and unit length", e1.length === 768 && Math.abs(cos(e1, e1) - 1) < 1e-9);
  ok("similar wording scores higher than unrelated", cos(e1, e2) > cos(e1, e3) + 0.15, `(${cos(e1, e2).toFixed(2)} vs ${cos(e1, e3).toFixed(2)})`);
  await embedTexts({ embed: async () => [[1, 2, 3]] } as any, ["x"]).then(() => ok("wrong-size vector rejected", false), () => ok("wrong-size vector rejected", true));
  const big = await embedTexts({ embed: async (t: string[]) => t.map(() => new Array(768).fill(2)) } as any, new Array(120).fill("x"));
  ok("120 texts are batched, each vector normalised", big.length === 120 && Math.abs(cos(big[0], big[0]) - 1) < 1e-9);

  console.log("== Gemini embeddings against a fake server");
  const seen: { url: string; body: any }[] = [];
  const server = http.createServer((req, res) => {
    let raw = ""; req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}"); seen.push({ url: req.url ?? "", body });
      const n = body.requests?.length ?? 1;
      const vec = () => ({ values: new Array(768).fill(0.5) });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ embeddings: Array.from({ length: n }, vec), embedding: vec() }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const gem = new GeminiProvider("k", "gemini-3.5-flash-lite", "gemini-embedding-001", `http://127.0.0.1:${(server.address() as any).port}`);
  const vecs = await gem.embed(["one", "two", "three"]);
  const sent = seen[0];
  console.log("   request path:", sent.url.split("?")[0]);
  ok("3 texts -> 3 vectors of 768", vecs.length === 3 && vecs.every((v) => v.length === 768));
  ok("embedding model in the path", sent.url.includes("gemini-embedding-001"));
  const reqs = sent.body.requests ?? [sent.body];
  ok("asks for 768 dimensions", reqs.every((r: any) => (r.outputDimensionality ?? r.embedContentConfig?.outputDimensionality) === 768), JSON.stringify(reqs[0]).slice(0, 160));
  ok("asks for semantic-similarity task type", reqs.every((r: any) => (r.taskType ?? r.embedContentConfig?.taskType) === "SEMANTIC_SIMILARITY"));
  server.close();

  console.log(fails === 0 ? "\nALL PASSED" : `\n${fails} FAILED`);
  process.exit(fails === 0 ? 0 : 1);
})();
